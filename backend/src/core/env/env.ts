import { config } from "dotenv"

config()

import { z } from "zod"
import { EnvSchema } from "./EnvSchema.js"

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid environment:\n" + z.prettifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data
