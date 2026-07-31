import { z } from "zod"
import { ProtocolFamilyCodeSchema } from "../../../core/supported-protocol/types"

export const ConfigLimitSchema = z.object({
  id: z.uuid(),
  protocolFamily: ProtocolFamilyCodeSchema,
  maxCount: z.number().int(),
  used: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
