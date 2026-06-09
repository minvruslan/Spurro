import { z } from "zod"
import { DeviceTypeSchema } from "../../device-type/types/DeviceTypeSchema"
import { EndpointSchema } from "../../endpoint/types/EndpointSchema"
import { GrantStatusSchema } from "./GrantStatusSchema"

export const ConfigSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  deviceType: DeviceTypeSchema,
  endpoint: EndpointSchema,
  config: z.unknown(),
  status: GrantStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
