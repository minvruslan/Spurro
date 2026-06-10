import { computed } from "vue"
import { getUsers } from "../services/getUsers"

export function useUsers() {
  const { data, status, error, refresh } = useAsyncData("users", () => getUsers())
  const users = computed(() => data.value ?? [])
  return { users, status, error, refresh }
}
