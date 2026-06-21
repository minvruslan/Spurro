import { computed } from "vue"
import { getConfigs } from "../services/getConfigs"

export function useConfigs() {
  const ready = useAsyncData("configs", () => getConfigs())
  const configs = computed(() => ready.data.value ?? [])
  return { configs, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
