import { z } from "zod"
import { PortSchema, SupportedProtocolCodeSchema } from "@spurro/shared"

export const EndpointContractSchema = z.object({
  protocolCode: SupportedProtocolCodeSchema,
  port: PortSchema,
  version: z.string().optional(),
  deployedAt: z.iso.datetime().optional(),
})
