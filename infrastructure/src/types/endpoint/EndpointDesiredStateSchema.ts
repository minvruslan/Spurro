import { z } from "zod"
import { PortSchema, SupportedProtocolCodeSchema } from "@spurro/shared"

export const EndpointDesiredStateSchema = z.looseObject({
  protocolCode: SupportedProtocolCodeSchema,
  port: PortSchema,
})
