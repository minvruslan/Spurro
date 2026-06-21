import { computed } from "vue"
import { getUsers } from "../services/getUsers"

export function useUsers() {
  const ready = useAsyncData("users", () => getUsers())
  const users = computed(() => ready.data.value ?? [])
  return { users, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
