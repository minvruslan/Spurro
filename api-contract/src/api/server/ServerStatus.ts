import type { z } from "zod"
import type { ServerStatusSchema } from "./ServerStatusSchema"

export type ServerStatus = z.infer<typeof ServerStatusSchema>
