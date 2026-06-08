import { z } from "zod"
import { GrantStatusSchema } from "./GrantStatusSchema"

export const ConfigSchema = z.object({
  id: z.uuid(),
  endpointId: z.uuid(),
  deviceTypeId: z.uuid(),
  label: z.string(),
  config: z.unknown(),
  status: GrantStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
