import { z } from "zod"
import { ServerDesiredStateSchema } from "./ServerDesiredStateSchema"
import { ServerSSHSchema } from "./ServerSSHSchema"

export const ServerActualStateSchema = ServerDesiredStateSchema.partial().extend({
  ssh: ServerSSHSchema,
  appliedAt: z.iso.datetime(),
})
