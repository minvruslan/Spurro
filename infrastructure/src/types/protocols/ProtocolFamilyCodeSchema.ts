import { z } from "zod"
import { ProtocolFamilyRegistry } from "./ProtocolFamilyRegistry"
import type { ProtocolFamilyCode } from "./ProtocolFamilyCode"

export const ProtocolFamilyCodeSchema = z.enum(
  Object.keys(ProtocolFamilyRegistry) as [ProtocolFamilyCode, ...ProtocolFamilyCode[]],
)
