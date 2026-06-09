import { z } from "zod"
import { ProtocolTypeSchema } from "./ProtocolTypeSchema"

export const ProtocolSchema = z.object({
  id: z.uuid(),
  version: z.string(),
  type: ProtocolTypeSchema,
})
