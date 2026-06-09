import { computed } from "vue"
import { getConfigLimits } from "../services/getConfigLimits"

export function useConfigLimits() {
  const { data, status, error, refresh } = useAsyncData("config-limits", () => getConfigLimits())
  const configLimits = computed(() => data.value ?? [])
  return { configLimits, status, error, refresh }
}
