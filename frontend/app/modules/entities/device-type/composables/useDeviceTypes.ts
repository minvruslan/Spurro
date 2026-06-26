import { computed } from "vue"
import { getDeviceTypes } from "../services/getDeviceTypes"

export function useDeviceTypes() {
  const ready = useAsyncData("device-types", () => getDeviceTypes())
  const deviceTypes = computed(() => ready.data.value ?? [])
  return { deviceTypes, status: ready.status, error: ready.error, refresh: ready.refresh, ready }
}
