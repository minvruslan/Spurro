import type { z } from "zod"
import type { ServerSSHSchema } from "./ServerSSHSchema"

export type ServerSSH = z.infer<typeof ServerSSHSchema>
