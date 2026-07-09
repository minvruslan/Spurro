import type { z } from "zod"
import type { SupportedProtocolFamilySchema } from "./SupportedProtocolFamilySchema"

export type SupportedProtocolFamily = z.infer<typeof SupportedProtocolFamilySchema>
