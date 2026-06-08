import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

config()

export default defineConfig({
  schema: ["./src/core/database/schema.ts", "./src/core/database/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
})
