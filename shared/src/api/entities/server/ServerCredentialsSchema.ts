import { z } from "zod"
import { UnixUsernameSchema } from "../../../core/unix/UnixUsernameSchema"

export const ServerCredentialsSchema = z.object({
  login: UnixUsernameSchema,
  password: z.string().min(1),
})
