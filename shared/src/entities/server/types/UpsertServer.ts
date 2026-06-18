import type { z } from "zod"
import type { UpsertServerSchema } from "./UpsertServerSchema"

export type UpsertServer = z.infer<typeof UpsertServerSchema>
