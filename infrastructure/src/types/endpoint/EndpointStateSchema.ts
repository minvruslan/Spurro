import { z } from "zod"

export const EndpointStateSchema = z.looseObject({
  deployedAt: z.iso.datetime().optional(),
})
