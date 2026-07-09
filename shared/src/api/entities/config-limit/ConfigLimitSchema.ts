import { z } from "zod"
import { SupportedProtocolFamilySchema } from "../../../core/supported-protocol/types"

export const ConfigLimitSchema = z.object({
  id: z.uuid(),
  protocolFamily: SupportedProtocolFamilySchema,
  maxCount: z.number().int(),
  used: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
