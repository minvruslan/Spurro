import type { z } from "zod"
import type { ProtocolRegistry } from "./ProtocolRegistry"
import type { ProtocolCode } from "./ProtocolCode"

export type ConfigData = {
  [Code in ProtocolCode]: z.infer<(typeof ProtocolRegistry)[Code]["configDataSchema"]>
}[ProtocolCode]
