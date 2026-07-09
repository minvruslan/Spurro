import { z } from "zod"
import { SupportedProtocolCodeSchema } from "../../../../core/supported-protocol/types/SupportedProtocolCodeSchema"
import { UnixPathSchema } from "../../../../core/unix/UnixPathSchema"
import { EndpointContractSchema } from "../common/EndpointContractSchema"
import { Amneziawg2KeySchema } from "./Amneziawg2KeySchema"

const DockerNameSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/)

export const Amneziawg2EndpointContractSchema = EndpointContractSchema.extend({
  protocolCode: z.literal(SupportedProtocolCodeSchema.enum.amneziawg2),
  containerName: DockerNameSchema,
  stateVolumeName: DockerNameSchema,
  stateDirectory: UnixPathSchema,
  interfaceName: z.string().regex(/^[a-zA-Z0-9_-]{1,15}$/),
  subnetPrefix: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/),
  serverPrivateKey: Amneziawg2KeySchema,
  serverPublicKey: Amneziawg2KeySchema,
})
