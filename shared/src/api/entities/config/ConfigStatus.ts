import type { z } from "zod"
import type { ConfigStatusSchema } from "./ConfigStatusSchema"

export type ConfigStatus = z.infer<typeof ConfigStatusSchema>
