import { z } from "zod"
import { ProtocolFamilyCodeSchema } from "../../../core/supported-protocol/types"

export const UpsertConfigLimitSchema = z.object({
  protocolFamily: ProtocolFamilyCodeSchema,
  maxCount: z.number().int().min(0),
})
