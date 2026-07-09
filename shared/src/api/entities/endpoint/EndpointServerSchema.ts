import { z } from "zod"
import { CountryCodeSchema } from "../../../core/country-code/CountryCodeSchema"

export const EndpointServerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  country: CountryCodeSchema,
})
