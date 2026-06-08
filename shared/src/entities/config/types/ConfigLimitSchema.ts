import { z } from "zod"

export const ConfigLimitSchema = z.object({
  id: z.uuid(),
  protocolType: z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
  }),
  maxCount: z.number().int(),
  used: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
