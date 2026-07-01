import type { AMNEZIAWG_PROTOCOL_CODE } from "@spurro/shared"

export type AmneziawgPeerConfig = {
  protocol: typeof AMNEZIAWG_PROTOCOL_CODE
  ip: string
  publicKey: string
  privateKey: string
  configuration: string
}
