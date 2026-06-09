import { z } from "zod"
import { ProtocolSchema } from "../../protocol/types/ProtocolSchema"
import { ServerSchema } from "../../server/types/ServerSchema"

export const EndpointSchema = z.object({
  id: z.uuid(),
  port: z.number().int(),
  protocol: ProtocolSchema,
  server: ServerSchema,
})
