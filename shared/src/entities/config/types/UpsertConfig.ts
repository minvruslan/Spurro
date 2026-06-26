import type { z } from "zod"
import type { UpsertConfigSchema } from "./UpsertConfigSchema"

export type UpsertConfig = z.infer<typeof UpsertConfigSchema>
