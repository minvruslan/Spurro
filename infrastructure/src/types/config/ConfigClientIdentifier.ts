import type { z } from "zod"
import type { ProtocolRegistry } from "../protocols/ProtocolRegistry"
import type { ProtocolCode } from "../protocols/ProtocolCode"

export type ConfigClientIdentifier = {
  [Code in ProtocolCode]: z.infer<(typeof ProtocolRegistry)[Code]["clientIdentifierSchema"]>
}[ProtocolCode]
