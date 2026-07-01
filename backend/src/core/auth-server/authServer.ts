import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, magicLink } from "better-auth/plugins"
import { eq } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import * as schema from "@/core/database/schemas/authSchema.js"
import { user } from "@/core/database/schemas/authSchema.js"
import { env } from "@/core/env/index.js"

const MAGIC_LINK_FILE = resolve(process.cwd(), "magic-link.log")

export const authServer = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: false,
  },
  advanced: {
    ipAddress: {
      // Real client IP comes from X-Forwarded-For. The proxy must overwrite it, not append,
      // or clients could spoof it and bypass rate limiting.
      ipAddressHeaders: ["x-forwarded-for"],
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/magic-link": { window: 60, max: 3 },
    },
  },
  plugins: [
    admin(),
    magicLink({
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        const [existing] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, email))
          .limit(1)
        if (!existing) return
        // TODO: wire up a real email provider.
        await writeFile(MAGIC_LINK_FILE, `${url}\n`)
        console.log(`\n[magic-link] ${email}\n${url}\nsaved to ${MAGIC_LINK_FILE}\n`)
      },
    }),
  ],
})
