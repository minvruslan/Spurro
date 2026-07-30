import type { z } from "zod"
import type { ProtocolRegistry } from "./ProtocolRegistry"
import type { ProtocolCode } from "./ProtocolCode"

export type ConfigProtocolFields = {
  [Code in ProtocolCode]: {
    data: z.infer<(typeof ProtocolRegistry)[Code]["configDataSchema"]>
    clientIdentifier: z.infer<(typeof ProtocolRegistry)[Code]["clientIdentifierSchema"]>
  }
}[ProtocolCode]
