import { z } from "zod"
import { SupportedProtocolCodeSchema, UnixPathSchema } from "@spurro/shared"
import { EndpointDesiredStateSchema } from "../../EndpointDesiredStateSchema"
import { Amneziawg2KeySchema } from "./Amneziawg2KeySchema"

const DockerNameSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/)

export const Amneziawg2EndpointDesiredStateSchema = EndpointDesiredStateSchema.extend({
  protocolCode: z.literal(SupportedProtocolCodeSchema.enum.amneziawg2),
  dockerImageVersion: z.string(),
  containerName: DockerNameSchema,
  stateVolumeName: DockerNameSchema,
  stateDirectory: UnixPathSchema,
  interfaceName: z.string().regex(/^[a-zA-Z0-9_-]{1,15}$/),
  subnetPrefix: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/),
  serverPrivateKey: Amneziawg2KeySchema,
  serverPublicKey: Amneziawg2KeySchema,
})
