import type { TransportProtocol } from "../../network/TransportProtocol"
import type { SupportedProtocolCode } from "../types/SupportedProtocolCode"
import type { SupportedProtocolFamily } from "../types/SupportedProtocolFamily"

export const SUPPORTED_PROTOCOLS: Record<
  SupportedProtocolCode,
  {
    family: SupportedProtocolFamily
    name: string
    defaultPort: number
    transportProtocol: TransportProtocol
  }
> = {
  amneziawg2: {
    family: "amneziawg",
    name: "AmneziaWG 2",
    defaultPort: 51820,
    transportProtocol: "udp",
  },
}
