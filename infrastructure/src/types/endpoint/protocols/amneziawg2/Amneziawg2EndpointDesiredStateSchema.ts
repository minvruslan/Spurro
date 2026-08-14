import { z } from "zod"
import { ProtocolCodeSchema } from "../../../protocols/ProtocolCodeSchema"
import { DomainNameSchema } from "../../../common/network/DomainNameSchema"
import { IpSchema } from "../../../common/network/IpSchema"
import { UnixPathSchema } from "../../../common/unix/UnixPathSchema"
import { EndpointDesiredStateSchema } from "../../EndpointDesiredStateSchema"
import { Amneziawg2KeySchema } from "./Amneziawg2KeySchema"
import { Amneziawg2ServerObfuscationSchema } from "./Amneziawg2ServerObfuscationSchema"

const DockerNameSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/)

export const Amneziawg2EndpointDesiredStateSchema = EndpointDesiredStateSchema.extend({
  protocolCode: z.literal(ProtocolCodeSchema.enum.amneziawg2),
  host: z.union([DomainNameSchema, IpSchema]),
  dns: z
    .string()
    .min(1)
    .refine(
      (value) => value.split(",").every((entry) => IpSchema.safeParse(entry.trim()).success),
      {
        message: "DNS must be a comma-separated list of IP addresses",
      },
    ),
  dockerImageVersion: z.string(),
  containerName: DockerNameSchema,
  stateVolumeName: DockerNameSchema,
  stateDirectory: UnixPathSchema,
  interfaceName: z.string().regex(/^[a-zA-Z0-9_-]{1,15}$/),
  subnetPrefix: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/),
  serverPrivateKey: Amneziawg2KeySchema,
  serverPublicKey: Amneziawg2KeySchema,
  obfuscation: Amneziawg2ServerObfuscationSchema,
})
