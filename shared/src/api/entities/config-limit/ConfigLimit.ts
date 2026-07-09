import type { z } from "zod"
import type { ConfigLimitSchema } from "./ConfigLimitSchema"

export type ConfigLimit = z.infer<typeof ConfigLimitSchema>
