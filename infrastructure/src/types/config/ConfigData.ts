import type { z } from "zod"
import type { ProtocolRegistry } from "../protocols/ProtocolRegistry"
import type { ProtocolCode } from "../protocols/ProtocolCode"

export type ConfigData = {
  [Code in ProtocolCode]: z.infer<(typeof ProtocolRegistry)[Code]["configDataSchema"]>
}[ProtocolCode]
