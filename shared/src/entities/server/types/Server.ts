import type { z } from "zod"
import type { ServerSchema } from "./ServerSchema"

export type Server = z.infer<typeof ServerSchema>
