import { computed } from "vue"
import { getProtocolTypes } from "../services/getProtocolTypes"

export function useProtocolTypes() {
  const ready = useAsyncData("protocol-types", () => getProtocolTypes())
  const protocolTypes = computed(() => ready.data.value ?? [])
  return { protocolTypes, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
