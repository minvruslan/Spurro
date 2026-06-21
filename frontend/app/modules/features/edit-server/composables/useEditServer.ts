import { ref } from "vue"
import type { Server, UpsertServer } from "@spurro/shared"
import { updateServer } from "@/modules/entities/server"
import type { EditServerFormValues } from "../types"

export function useEditServer(id: string) {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function submit(values: EditServerFormValues): Promise<Server | null> {
    if (pending.value) return null

    pending.value = true
    error.value = null

    try {
      const payload: UpsertServer = {
        name: values.name,
        country: values.country,
        ip: values.ip,
        domainName: values.domainName || undefined,
      }

      return await updateServer(id, payload)
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error"
      return null
    } finally {
      pending.value = false
    }
  }

  return { pending, error, submit }
}
