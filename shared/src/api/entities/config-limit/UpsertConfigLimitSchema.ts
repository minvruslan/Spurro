import { z } from "zod"
import { SupportedProtocolFamilySchema } from "../../../core/supported-protocol/types"

export const UpsertConfigLimitSchema = z.object({
  protocolFamily: SupportedProtocolFamilySchema,
  maxCount: z.number().int().min(0),
})
