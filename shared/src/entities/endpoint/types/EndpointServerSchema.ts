import { z } from "zod"
import { CountryCodeSchema } from "../../../common/types/CountryCodeSchema"

export const EndpointServerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  country: CountryCodeSchema,
})
