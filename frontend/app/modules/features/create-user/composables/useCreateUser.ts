import { ref } from "vue"
import type { ProtocolFamilyCode, User, UpsertUser } from "@spurro/api-contract"
import { createUser } from "@/modules/entities/user"
import type { CreateUserFormValues } from "../types"

export function useCreateUser() {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function create(values: CreateUserFormValues): Promise<User | null> {
    if (pending.value) return null

    pending.value = true
    error.value = null

    try {
      const payload: UpsertUser = {
        name: values.name,
        email: values.email,
        limits: Object.entries(values.limits).map(([protocolFamily, maxCount]) => ({
          protocolFamily: protocolFamily as ProtocolFamilyCode,
          maxCount,
        })),
      }

      return await createUser(payload)
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error"
      return null
    } finally {
      pending.value = false
    }
  }

  return { pending, error, create }
}
