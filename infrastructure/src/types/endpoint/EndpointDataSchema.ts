import { z } from "zod"
import { EndpointStateSchema } from "./EndpointStateSchema"

export const EndpointDataSchema = z.looseObject({
  contract: z.unknown().optional(),
  state: EndpointStateSchema.optional(),
})
