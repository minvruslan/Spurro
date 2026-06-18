import { z } from "zod"

export const EndpointServerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  country: z.string(),
})
