import { z } from "zod"
import { UpsertServerEndpointSchema } from "./UpsertServerEndpointSchema"
import { ServerCredentialsSchema } from "./ServerCredentialsSchema"

export const UpsertServerSchema = z.object({
  name: z.string().min(1),
  domainName: z.string().optional(),
  ip: z.string().min(1),
  country: z.string().min(1),
  endpoints: UpsertServerEndpointSchema.array().optional(),
  credentials: ServerCredentialsSchema.optional(),
})
