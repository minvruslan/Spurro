import { ref } from "vue"
import { deleteServer as deleteServerService } from "@/modules/entities/server"

export function useDeleteServer(id: string) {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function deleteServer(): Promise<boolean> {
    if (pending.value) return false

    pending.value = true
    error.value = null

    try {
      await deleteServerService(id)
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error"
      return false
    } finally {
      pending.value = false
    }
  }

  return { pending, error, deleteServer }
}
