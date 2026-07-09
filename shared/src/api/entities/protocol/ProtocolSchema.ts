import { z } from "zod"
import {
  SupportedProtocolCodeSchema,
  SupportedProtocolFamilySchema,
} from "../../../core/supported-protocol/types"

export const ProtocolSchema = z.object({
  id: z.uuid(),
  code: SupportedProtocolCodeSchema,
  family: SupportedProtocolFamilySchema,
  name: z.string(),
})
