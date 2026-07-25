import { z } from "zod"
import { ServerStateSchema } from "./ServerStateSchema"

export const ServerDataSchema = z.looseObject({
  contract: z.unknown().optional(),
  state: ServerStateSchema,
})
