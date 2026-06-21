import type { z } from "zod"
import type { UpsertConfigLimitSchema } from "./UpsertConfigLimitSchema"

export type UpsertConfigLimit = z.infer<typeof UpsertConfigLimitSchema>
