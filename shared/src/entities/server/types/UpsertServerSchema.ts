import { z } from "zod"
import { UpsertServerEndpointSchema } from "./UpsertServerEndpointSchema"

export const UpsertServerSchema = z.object({
  name: z.string().min(1),
  domainName: z.string().min(1),
  ip: z.string().min(1),
  country: z.string().min(1),
  endpoints: UpsertServerEndpointSchema.array().optional(),
})
