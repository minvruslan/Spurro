import { z } from "zod"

export const UpsertServerEndpointSchema = z.object({
  id: z.uuid().optional(),
  protocolId: z.uuid(),
  port: z.number().int().min(1).max(65535),
})
