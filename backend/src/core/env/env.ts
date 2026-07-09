import { config } from "dotenv"

config()

import { z } from "zod"
import { CountryCodeSchema, DomainNameSchema, IPSchema } from "@spurro/shared"

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value)

const urlString = z
  .string()
  .min(1)
  .refine(
    (value) => {
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    { message: "must be a valid URL" },
  )

const EnvSchema = z.object({
  DATABASE_URL: urlString,
  QUEUE_URL: urlString,
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: urlString,
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().min(1).default("localhost"),
  ADMIN_EMAIL: z.email(),
  ADMIN_NAME: z.string().min(1).default("Admin"),
  DOMAIN_NAME: z.preprocess(emptyToUndefined, DomainNameSchema.optional()),
  IP: IPSchema,
  COUNTRY: z
    .string()
    .transform((value) => value.toUpperCase())
    .pipe(CountryCodeSchema),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("[env] invalid environment:\n" + z.prettifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data
