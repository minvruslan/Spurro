import type { z } from "zod"
import type { ProtocolSchema } from "./ProtocolSchema"

export type Protocol = z.infer<typeof ProtocolSchema>
