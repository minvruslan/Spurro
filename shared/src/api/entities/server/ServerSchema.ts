import { z } from "zod"
import { CountryCodeSchema } from "../../../core/country-code/CountryCodeSchema"
import { DomainNameSchema } from "../../../core/network/DomainNameSchema"
import { IPSchema } from "../../../core/network/IPSchema"
import { ServerEndpointSchema } from "./ServerEndpointSchema"
import { ServerStatusSchema } from "./ServerStatusSchema"

export const ServerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  domainName: DomainNameSchema.nullable(),
  ip: IPSchema,
  country: CountryCodeSchema,
  status: ServerStatusSchema,
  isCurrent: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  endpoints: ServerEndpointSchema.array(),
})
