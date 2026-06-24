import { z } from "zod"
import { CountryCodeSchema } from "../../../common/types/CountryCodeSchema"
import { UpsertServerEndpointSchema } from "./UpsertServerEndpointSchema"
import { ServerCredentialsSchema } from "./ServerCredentialsSchema"

const isDomain = (value: string) =>
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(value)

const isIp = (value: string) =>
  z.ipv4().safeParse(value).success || z.ipv6().safeParse(value).success

export const UpsertServerSchema = z.object({
  name: z.string().min(1),
  domainName: z
    .string()
    .refine((value) => isDomain(value) || isIp(value))
    .optional(),
  ip: z.string().refine(isIp),
  country: CountryCodeSchema,
  endpoints: UpsertServerEndpointSchema.array().optional(),
  credentials: ServerCredentialsSchema.optional(),
})
