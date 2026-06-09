import { z } from "zod"

export const ServerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  country: z.string(),
})
