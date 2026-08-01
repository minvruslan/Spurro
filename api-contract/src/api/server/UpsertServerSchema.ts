import { z } from "zod"
import { CountryCodeSchema } from "../../core/country-code/CountryCodeSchema"
import { DomainNameSchema } from "@spurro/infrastructure/types"
import { IpSchema } from "@spurro/infrastructure/types"
import { UpsertServerEndpointSchema } from "./UpsertServerEndpointSchema"
import { ServerCredentialsSchema } from "./ServerCredentialsSchema"

export const UpsertServerSchema = z.object({
  name: z.string().min(1).max(255),
  domainName: DomainNameSchema.optional(),
  ip: IpSchema,
  country: CountryCodeSchema,
  endpoints: UpsertServerEndpointSchema.array().optional(),
  credentials: ServerCredentialsSchema.optional(),
})
