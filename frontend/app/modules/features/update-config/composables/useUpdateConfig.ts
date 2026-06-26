import { ref } from "vue"
import type { Config, UpdateConfig } from "@spurro/shared"
import { updateConfig } from "@/modules/entities/config"

export function useUpdateConfig(id: string) {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function update(payload: UpdateConfig): Promise<Config | null> {
    if (pending.value) return null

    pending.value = true
    error.value = null

    try {
      return await updateConfig(id, payload)
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error"
      return null
    } finally {
      pending.value = false
    }
  }

  return { pending, error, update }
}
