import { z } from "zod"

export const CountryCodeSchema = z.string().regex(/^[A-Z]{2}$/)
