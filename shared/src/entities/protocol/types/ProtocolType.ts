import type { z } from "zod"
import type { ProtocolTypeSchema } from "./ProtocolTypeSchema"

export type ProtocolType = z.infer<typeof ProtocolTypeSchema>
