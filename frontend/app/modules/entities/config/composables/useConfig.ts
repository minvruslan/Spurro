import { computed } from "vue"
import { getConfig } from "../services/getConfig"

export function useConfig(id: string) {
  const ready = useAsyncData(`config-${id}`, () => getConfig(id))
  const config = computed(() => ready.data.value ?? null)
  return { config, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
