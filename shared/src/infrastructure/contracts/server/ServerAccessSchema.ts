import { z } from "zod"
import { IPSchema } from "../../../core/network/IPSchema"
import { UnixUsernameSchema } from "../../../core/unix/UnixUsernameSchema"

export const ServerAccessSchema = z.object({
  ip: IPSchema,
  login: UnixUsernameSchema,
  password: z.string().min(1),
})
