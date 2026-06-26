import type { z } from "zod"
import type { UpdateConfigSchema } from "./UpdateConfigSchema"

export type UpdateConfig = z.infer<typeof UpdateConfigSchema>
