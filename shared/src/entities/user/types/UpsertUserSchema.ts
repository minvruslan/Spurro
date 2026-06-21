import { z } from "zod"
import { UpsertConfigLimitSchema } from "../../config-limit/types/UpsertConfigLimitSchema"

export const UpsertUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  limits: UpsertConfigLimitSchema.array().optional(),
})
