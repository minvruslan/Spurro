import { computed } from "vue"
import { getServers } from "../services/getServers"

export function useServers() {
  const { data, status, error, refresh } = useAsyncData("servers", () => getServers())
  const servers = computed(() => data.value ?? [])
  return { servers, status, error, refresh }
}
