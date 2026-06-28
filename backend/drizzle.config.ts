import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

config()

export default defineConfig({
  schema: [
    "./src/core/database/schemas/domainSchema.ts",
    "./src/core/database/schemas/authSchema.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
})
