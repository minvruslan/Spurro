import { ref } from "vue"
import { createConfig, type CreatedConfig } from "@/modules/entities/config"
import type { CreateConfigFormValues } from "../types"

export function useCreateConfig() {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function create(values: CreateConfigFormValues): Promise<CreatedConfig | null> {
    if (pending.value) return null

    pending.value = true
    error.value = null

    try {
      return await createConfig({
        name: values.name,
        endpointId: values.endpointId,
        deviceTypeId: values.deviceTypeId,
        ...(values.protocolOptions && { protocolOptions: values.protocolOptions }),
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error"
      return null
    } finally {
      pending.value = false
    }
  }

  return { pending, error, create }
}
