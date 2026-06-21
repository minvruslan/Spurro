import { computed } from "vue"
import { getServer } from "../services/getServer"

export function useServer(id: string) {
  const ready = useAsyncData(`server-${id}`, () => getServer(id))
  const server = computed(() => ready.data.value ?? null)
  return { server, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
