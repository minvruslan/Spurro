import type { SupportedProtocolCode } from "@spurro/shared"
import { Amneziawg2ProtocolClient } from "./amneziawg2/index.js"

export const PROTOCOL_CLIENTS = {
  amneziawg2: new Amneziawg2ProtocolClient(),
} satisfies Record<SupportedProtocolCode, unknown>

export function getProtocolClient(code: SupportedProtocolCode) {
  return PROTOCOL_CLIENTS[code]
}

export { Amneziawg2ProtocolClient } from "./amneziawg2/index.js"
