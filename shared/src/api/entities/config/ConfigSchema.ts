import { z } from "zod"
import { Amneziawg2ConfigDataSchema } from "../../../core/supported-protocol/types/Amneziawg2ConfigDataSchema"
import { DeviceTypeSchema } from "../device-type/DeviceTypeSchema"
import { EndpointSchema } from "../endpoint/EndpointSchema"
import { ConfigStatusSchema } from "./ConfigStatusSchema"

export const ConfigSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  deviceType: DeviceTypeSchema,
  endpoint: EndpointSchema,
  data: Amneziawg2ConfigDataSchema,
  status: ConfigStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
