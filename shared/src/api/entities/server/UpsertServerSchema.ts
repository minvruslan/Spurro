import { z } from "zod"
import { CountryCodeSchema } from "../../../core/country-code/CountryCodeSchema"
import { DomainNameSchema } from "../../../core/network/DomainNameSchema"
import { IpSchema } from "../../../core/network/IpSchema"
import { UpsertServerEndpointSchema } from "./UpsertServerEndpointSchema"
import { ServerCredentialsSchema } from "./ServerCredentialsSchema"

export const UpsertServerSchema = z.object({
  name: z.string().min(1),
  domainName: DomainNameSchema.optional(),
  ip: IpSchema,
  country: CountryCodeSchema,
  endpoints: UpsertServerEndpointSchema.array().optional(),
  credentials: ServerCredentialsSchema.optional(),
})
