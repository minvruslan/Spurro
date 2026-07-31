import { z } from "zod"
import { PortSchema } from "../common/network/PortSchema"
import { ProtocolCodeSchema } from "../protocols/ProtocolCodeSchema"

export const EndpointDesiredStateSchema = z.looseObject({
  protocolCode: ProtocolCodeSchema,
  port: PortSchema,
})
