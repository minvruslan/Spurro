import type { z } from "zod"
import type { GrantStatusSchema } from "./GrantStatusSchema"

export type GrantStatus = z.infer<typeof GrantStatusSchema>
