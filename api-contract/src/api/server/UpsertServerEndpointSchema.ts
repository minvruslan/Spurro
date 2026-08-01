import { z } from "zod"
import { PortSchema } from "@spurro/infrastructure/types"

export const UpsertServerEndpointSchema = z.object({
  id: z.uuid().optional(),
  protocolId: z.uuid(),
  port: PortSchema.optional(),
})
