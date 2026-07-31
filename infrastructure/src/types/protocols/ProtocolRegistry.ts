import type { z } from "zod"
import type { TransportProtocol } from "../common/network/TransportProtocol"
import { Amneziawg2EndpointDesiredStateSchema } from "../endpoint/protocols/amneziawg2/Amneziawg2EndpointDesiredStateSchema"
import { Amneziawg2ClientIdentifierSchema } from "./amneziawg2/Amneziawg2ClientIdentifierSchema"
import { Amneziawg2ConfigDataSchema } from "./amneziawg2/Amneziawg2ConfigDataSchema"
import type { ProtocolCode } from "./ProtocolCode"
import type { ProtocolFamilyCode } from "./ProtocolFamilyCode"

type ProtocolRegistryRecord = {
  family: ProtocolFamilyCode
  name: string
  defaultPort: number
  transportProtocol: TransportProtocol
  configDataSchema: z.ZodType
  clientIdentifierSchema: z.ZodType
  endpointDesiredStateSchema: z.ZodType
}

export const ProtocolRegistry = {
  amneziawg2: {
    family: "amneziawg",
    name: "AmneziaWG 2",
    defaultPort: 51820,
    transportProtocol: "udp",
    configDataSchema: Amneziawg2ConfigDataSchema,
    clientIdentifierSchema: Amneziawg2ClientIdentifierSchema,
    endpointDesiredStateSchema: Amneziawg2EndpointDesiredStateSchema,
  },
} as const satisfies Record<ProtocolCode, ProtocolRegistryRecord>
