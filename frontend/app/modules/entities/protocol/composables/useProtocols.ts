import { computed } from "vue"
import { getProtocols } from "../services/getProtocols"

export function useProtocols() {
  const { data, status, error, refresh } = useAsyncData("protocols", () => getProtocols())
  const protocols = computed(() => data.value ?? [])
  return { protocols, status, error, refresh }
}
