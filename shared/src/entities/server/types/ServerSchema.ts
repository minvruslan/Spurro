import { z } from "zod"
import { ServerEndpointSchema } from "./ServerEndpointSchema"
import { ServerStatusSchema } from "./ServerStatusSchema"

export const ServerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  domainName: z.string(),
  ip: z.string(),
  country: z.string(),
  status: ServerStatusSchema,
  isCurrent: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  endpoints: ServerEndpointSchema.array(),
})
