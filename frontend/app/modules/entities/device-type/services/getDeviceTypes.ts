import type { DeviceType } from "@vancloak/api-contract"

export async function getDeviceTypes(): Promise<DeviceType[]> {
  return useApiClient().deviceTypes.getDeviceTypes()
}
