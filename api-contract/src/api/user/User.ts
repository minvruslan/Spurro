import type { z } from "zod"
import type { UserSchema } from "./UserSchema"

export type User = z.infer<typeof UserSchema>
