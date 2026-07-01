import { z } from "zod"
import { DeviceTypeSchema } from "../../device-type/types/DeviceTypeSchema"
import { EndpointSchema } from "../../endpoint/types/EndpointSchema"
import { ConfigStatusSchema } from "./ConfigStatusSchema"

export const ConfigSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  deviceType: DeviceTypeSchema,
  endpoint: EndpointSchema,
  data: z.unknown(),
  status: ConfigStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
