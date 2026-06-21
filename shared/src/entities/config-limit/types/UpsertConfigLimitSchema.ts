import { z } from "zod"

export const UpsertConfigLimitSchema = z.object({
  protocolTypeId: z.uuid(),
  maxCount: z.number().int().min(0),
})
