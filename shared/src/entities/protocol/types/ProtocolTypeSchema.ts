import { z } from "zod"

export const ProtocolTypeSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
})
