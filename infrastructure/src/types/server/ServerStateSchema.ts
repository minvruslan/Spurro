import { z } from "zod"
import { PortSchema } from "@spurro/shared"

export const ServerStateSchema = z.looseObject({
  ssh: z.union([
    z.object({ username: z.string().min(1), password: z.string().min(1), port: PortSchema }),
    z.object({ hardenedAt: z.iso.datetime() }),
  ]),
  sshHostKeys: z.array(z.string().min(1)).optional(),
})
