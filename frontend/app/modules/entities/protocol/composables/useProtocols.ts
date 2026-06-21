import { computed } from "vue"
import { getProtocols } from "../services/getProtocols"

export function useProtocols() {
  const ready = useAsyncData("protocols", () => getProtocols())
  const protocols = computed(() => ready.data.value ?? [])
  return { protocols, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
