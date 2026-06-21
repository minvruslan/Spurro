import { ref } from "vue"
import type { User, UpsertUser } from "@spurro/shared"
import { updateUser } from "@/modules/entities/user"
import type { EditUserFormValues } from "../types"

export function useEditUser(id: string) {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function submit(values: EditUserFormValues): Promise<User | null> {
    if (pending.value) return null

    pending.value = true
    error.value = null

    try {
      const payload: UpsertUser = {
        name: values.name,
        email: values.email,
        limits: Object.entries(values.limits).map(([protocolTypeId, maxCount]) => ({
          protocolTypeId,
          maxCount,
        })),
      }

      return await updateUser(id, payload)
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error"
      return null
    } finally {
      pending.value = false
    }
  }

  return { pending, error, submit }
}
