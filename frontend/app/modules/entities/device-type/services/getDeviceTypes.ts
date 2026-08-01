import type { DeviceType } from "@spurro/api-contract"

export async function getDeviceTypes(): Promise<DeviceType[]> {
  return useApiClient().deviceTypes.getDeviceTypes()
}
