import { z } from "zod"
import { EndpointStatusSchema } from "../../endpoint/types/EndpointStatusSchema"

export const UpsertServerEndpointSchema = z.object({
  id: z.uuid().optional(),
  protocolId: z.uuid(),
  port: z.number().int().min(1).max(65535),
  status: EndpointStatusSchema.optional(),
})
