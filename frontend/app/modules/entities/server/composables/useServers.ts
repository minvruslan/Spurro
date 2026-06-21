import { computed } from "vue"
import { getServers } from "../services/getServers"

export function useServers() {
  const ready = useAsyncData("servers", () => getServers())
  const servers = computed(() => ready.data.value ?? [])
  return { servers, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
