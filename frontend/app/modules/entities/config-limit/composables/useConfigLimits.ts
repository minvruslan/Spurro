import { computed } from "vue"
import { getConfigLimits } from "../services/getConfigLimits"

export function useConfigLimits() {
  const ready = useAsyncData("config-limits", () => getConfigLimits())
  const configLimits = computed(() => ready.data.value ?? [])
  return { configLimits, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
