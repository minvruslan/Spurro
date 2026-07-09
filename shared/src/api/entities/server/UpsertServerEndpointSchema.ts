import { z } from "zod"
import { PortSchema } from "../../../core/network/PortSchema"

export const UpsertServerEndpointSchema = z.object({
  id: z.uuid().optional(),
  protocolId: z.uuid(),
  port: PortSchema.optional(),
})
