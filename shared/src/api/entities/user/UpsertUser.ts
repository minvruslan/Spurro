import type { z } from "zod"
import type { UpsertUserSchema } from "./UpsertUserSchema"

export type UpsertUser = z.infer<typeof UpsertUserSchema>
