import { ref } from "vue"
import type { Server, UpsertServer } from "@spurro/shared"
import { createServer } from "@/modules/entities/server"
import type { CreateServerFormValues } from "../types"

export function useCreateServer() {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function create(values: CreateServerFormValues): Promise<Server | null> {
    if (pending.value) return null

    pending.value = true
    error.value = null

    try {
      const payload: UpsertServer = {
        name: values.name,
        country: values.country,
        ip: values.ip,
        domainName: values.domainName || undefined,
        endpoints: values.protocolIds.map((protocolId) => ({ protocolId })),
        credentials: { login: values.login, password: values.password },
      }

      return await createServer(payload)
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error"
      return null
    } finally {
      pending.value = false
    }
  }

  return { pending, error, create }
}
