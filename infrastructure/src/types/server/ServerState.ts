import type { z } from "zod"
import type { ServerStateSchema } from "./ServerStateSchema"

export type ServerState = z.infer<typeof ServerStateSchema>
