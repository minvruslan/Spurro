import { z } from "zod"
import { CountryCodeSchema } from "../../../core/country-code/CountryCodeSchema"
import { DomainNameSchema } from "../../../core/network/DomainNameSchema"
import { IPSchema } from "../../../core/network/IPSchema"
import { UpsertServerEndpointSchema } from "./UpsertServerEndpointSchema"
import { ServerCredentialsSchema } from "./ServerCredentialsSchema"

export const UpsertServerSchema = z.object({
  name: z.string().min(1),
  domainName: DomainNameSchema.optional(),
  ip: IPSchema,
  country: CountryCodeSchema,
  endpoints: UpsertServerEndpointSchema.array().optional(),
  credentials: ServerCredentialsSchema.optional(),
})
