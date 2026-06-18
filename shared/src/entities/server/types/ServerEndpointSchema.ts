import { z } from "zod"
import { ProtocolSchema } from "../../protocol/types/ProtocolSchema"
import { EndpointStatusSchema } from "../../endpoint/types/EndpointStatusSchema"

export const ServerEndpointSchema = z.object({
  id: z.uuid(),
  port: z.number().int(),
  status: EndpointStatusSchema,
  protocol: ProtocolSchema,
})
