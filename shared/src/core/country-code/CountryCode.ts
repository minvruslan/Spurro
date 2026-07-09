import type { z } from "zod"
import type { CountryCodeSchema } from "./CountryCodeSchema"

export type CountryCode = z.infer<typeof CountryCodeSchema>
