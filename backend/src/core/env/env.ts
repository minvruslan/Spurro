import { startupLogger } from "@/core/logger/index.js"
import { config } from "dotenv"

config()

import { z } from "zod"
import { CountryCodeSchema, DomainNameSchema, IpSchema } from "@spurro/api-contract"

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value)

const unescapeNewlines = (value: unknown) =>
  typeof value === "string" ? value.replaceAll("\\n", "\n") : value

const OPENSSH_PRIVATE_KEY_HEADER = "-----BEGIN OPENSSH PRIVATE KEY-----"
const AUTHORIZED_KEYS_LINE_PATTERN = /^\S+ \S+( [^\n]*)?$/

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
    { message: "Must be a valid URL" },
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
  APP_ENCRYPTION_KEY: z
    .string()
    .min(1)
    .refine((value) => Buffer.from(value, "base64").length === 32, {
      message: "Must be 32 bytes encoded as base64 (generate: openssl rand -base64 32)",
    }),
  APP_SSH_PRIVATE_KEY: z.preprocess(
    unescapeNewlines,
    z
      .string()
      .refine((value) => value.startsWith(OPENSSH_PRIVATE_KEY_HEADER), {
        message: `must be an OpenSSH private key starting with "${OPENSSH_PRIVATE_KEY_HEADER}"`,
      })
      .transform((value) => (value.endsWith("\n") ? value : `${value}\n`)),
  ),
  OPERATOR_SSH_PUBLIC_KEY: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(AUTHORIZED_KEYS_LINE_PATTERN, {
        message: "Must be a single authorized_keys line: <type> <base64> [comment]",
      })
      .optional(),
  ),
  DOMAIN_NAME: z.preprocess(emptyToUndefined, DomainNameSchema.optional()),
  IP: IpSchema,
  COUNTRY: z
    .string()
    .transform((value) => value.toUpperCase())
    .pipe(CountryCodeSchema),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  startupLogger.error("Invalid environment:\n" + z.prettifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data
