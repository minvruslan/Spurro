import type { z } from "zod"
import type { TransportProtocol } from "../common/network/TransportProtocol"
import type { EndpointActualState } from "../endpoint/EndpointActualState"
import type { EndpointDesiredState } from "../endpoint/EndpointDesiredState"
import { Amneziawg2EndpointActualStateSchema } from "../endpoint/protocols/amneziawg2/Amneziawg2EndpointActualStateSchema"
import { Amneziawg2EndpointDesiredStateSchema } from "../endpoint/protocols/amneziawg2/Amneziawg2EndpointDesiredStateSchema"
import { Amneziawg2ClientIdentifierSchema } from "../config/protocols/amneziawg2/Amneziawg2ClientIdentifierSchema"
import { Amneziawg2ConfigDataSchema } from "../config/protocols/amneziawg2/Amneziawg2ConfigDataSchema"
import { Amneziawg2ConfigOptionsSchema } from "../config/protocols/amneziawg2/Amneziawg2ConfigOptionsSchema"
import type { ProtocolCode } from "./ProtocolCode"
import type { ProtocolFamilyCode } from "./ProtocolFamilyCode"

type ProtocolRegistryRecord = {
  family: ProtocolFamilyCode
  name: string
  defaultPort: number
  transportProtocol: TransportProtocol
  configDataSchema: z.ZodObject
  configOptionsSchema: z.ZodObject
  clientIdentifierSchema: z.ZodType
  endpointDesiredStateSchema: z.ZodType<EndpointDesiredState>
  endpointActualStateSchema: z.ZodType<EndpointActualState>
}

export const ProtocolRegistry = {
  amneziawg2: {
    family: "amneziawg",
    name: "AmneziaWG 2",
    defaultPort: 443,
    transportProtocol: "udp",
    configDataSchema: Amneziawg2ConfigDataSchema,
    configOptionsSchema: Amneziawg2ConfigOptionsSchema,
    clientIdentifierSchema: Amneziawg2ClientIdentifierSchema,
    endpointDesiredStateSchema: Amneziawg2EndpointDesiredStateSchema,
    endpointActualStateSchema: Amneziawg2EndpointActualStateSchema,
  },
} as const satisfies Record<ProtocolCode, ProtocolRegistryRecord>
