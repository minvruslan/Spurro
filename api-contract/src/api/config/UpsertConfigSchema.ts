import { z } from "zod"
import { ConfigProtocolOptionsSchema } from "@spurro/infrastructure/types"

export const UpsertConfigSchema = z.object({
  name: z.string().min(1).max(255),
  endpointId: z.uuid(),
  deviceTypeId: z.uuid(),
  protocolOptions: ConfigProtocolOptionsSchema.optional(),
})
