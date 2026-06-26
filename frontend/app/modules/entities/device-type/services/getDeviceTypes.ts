import type { DeviceType } from "@spurro/shared"
import { DeviceTypeSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: z.array(DeviceTypeSchema) })

export async function getDeviceTypes(): Promise<DeviceType[]> {
  const api = useApi()
  const response = await api("/api/device-types")
  return ResponseSchema.parse(response).data
}
