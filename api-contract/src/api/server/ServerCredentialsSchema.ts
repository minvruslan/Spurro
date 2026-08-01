import { z } from "zod"
import { UnixUsernameSchema } from "@spurro/infrastructure/types"

export const ServerCredentialsSchema = z.object({
  username: UnixUsernameSchema,
  password: z.string().min(1),
})
