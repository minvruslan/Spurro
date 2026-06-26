import { computed } from "vue"
import { getEndpoints } from "../services/getEndpoints"

export function useEndpoints() {
  const ready = useAsyncData("endpoints", () => getEndpoints())
  const endpoints = computed(() => ready.data.value ?? [])
  return { endpoints, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
