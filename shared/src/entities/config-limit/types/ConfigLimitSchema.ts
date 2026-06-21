import { z } from "zod"
import { ProtocolTypeSchema } from "../../protocol/types/ProtocolTypeSchema"

export const ConfigLimitSchema = z.object({
  id: z.uuid(),
  protocolType: ProtocolTypeSchema,
  maxCount: z.number().int(),
  used: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
