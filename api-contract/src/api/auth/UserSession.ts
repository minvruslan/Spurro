import type { z } from "zod"
import type { UserSessionSchema } from "./UserSessionSchema"

export type UserSession = z.infer<typeof UserSessionSchema>
