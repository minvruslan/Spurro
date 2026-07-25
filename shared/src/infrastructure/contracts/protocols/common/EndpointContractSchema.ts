import { z } from "zod"
import { PortSchema } from "../../../../core/network/PortSchema"
import { SupportedProtocolCodeSchema } from "../../../../core/supported-protocol/types/SupportedProtocolCodeSchema"

export const EndpointContractSchema = z.object({
  protocolCode: SupportedProtocolCodeSchema,
  port: PortSchema,
  version: z.string().optional(),
  deployedAt: z.iso.datetime().optional(),
})
