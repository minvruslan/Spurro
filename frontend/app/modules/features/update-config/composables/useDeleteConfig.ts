import { ref } from "vue"
import { deleteConfig as deleteConfigService } from "@/modules/entities/config"

export function useDeleteConfig(id: string) {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function deleteConfig(): Promise<boolean> {
    if (pending.value) return false

    pending.value = true
    error.value = null

    try {
      await deleteConfigService(id)
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error"
      return false
    } finally {
      pending.value = false
    }
  }

  return { pending, error, deleteConfig }
}
