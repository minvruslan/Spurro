import { z } from "zod"
import { UpsertConfigLimitSchema } from "../config-limit/UpsertConfigLimitSchema"

export const UpsertUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  limits: UpsertConfigLimitSchema.array()
    .refine(
      (limits) => new Set(limits.map((limit) => limit.protocolFamily)).size === limits.length,
      { message: "Duplicate protocolFamily in limits" },
    )
    .optional(),
})
