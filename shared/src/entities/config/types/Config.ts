import type { z } from "zod"
import type { ConfigSchema } from "./ConfigSchema"

export type Config = z.infer<typeof ConfigSchema>
