import type { z } from "zod"
import type { SupportedProtocolCodeSchema } from "./SupportedProtocolCodeSchema"

export type SupportedProtocolCode = z.infer<typeof SupportedProtocolCodeSchema>
