import { z } from "zod"
import { IPSchema } from "../../../core/network/IPSchema"
import { PortSchema } from "../../../core/network/PortSchema"
import { UnixUsernameSchema } from "../../../core/unix/UnixUsernameSchema"

const ServerAccessBaseSchema = z.object({
  ip: IPSchema,
  port: PortSchema,
  username: UnixUsernameSchema,
  sshHostKeys: z.array(z.string().min(1)).min(1),
})

export const ServerAccessSchema = z.union([
  ServerAccessBaseSchema.extend({ privateKey: z.string().min(1) }),
  ServerAccessBaseSchema.extend({ password: z.string().min(1) }),
])
