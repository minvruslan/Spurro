import { ref } from "vue"
import { deleteUser as deleteUserService } from "@/modules/entities/user"

export function useDeleteUser(id: string) {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function deleteUser(): Promise<boolean> {
    if (pending.value) return false

    pending.value = true
    error.value = null

    try {
      await deleteUserService(id)
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error"
      return false
    } finally {
      pending.value = false
    }
  }

  return { pending, error, deleteUser }
}
