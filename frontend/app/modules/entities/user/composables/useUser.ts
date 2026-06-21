import { computed } from "vue"
import { getUser } from "../services/getUser"

export function useUser(id: string) {
  const ready = useAsyncData(`user-${id}`, () => getUser(id))
  const user = computed(() => ready.data.value ?? null)
  return { user, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
