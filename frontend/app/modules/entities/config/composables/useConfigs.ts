import { computed } from "vue"
import { getConfigs } from "../services/getConfigs"

export function useConfigs() {
  const { data, status, error, refresh } = useAsyncData("configs", () => getConfigs())
  const configs = computed(() => data.value ?? [])
  return { configs, status, error, refresh }
}
