import { z } from "zod"
import { ProtocolSchema } from "../../protocol/types/ProtocolSchema"
import { EndpointServerSchema } from "./EndpointServerSchema"

export const EndpointSchema = z.object({
  id: z.uuid(),
  port: z.number().int(),
  protocol: ProtocolSchema,
  server: EndpointServerSchema,
})
