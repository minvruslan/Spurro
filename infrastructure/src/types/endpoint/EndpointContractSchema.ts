import { z } from "zod"
import { PortSchema, SupportedProtocolCodeSchema } from "@spurro/shared"

export const EndpointContractSchema = z.looseObject({
  protocolCode: SupportedProtocolCodeSchema,
  port: PortSchema,
  dockerImageVersion: z.string().optional(),
})
