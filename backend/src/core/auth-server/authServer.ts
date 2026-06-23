import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, magicLink } from "better-auth/plugins"
import { eq } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import * as schema from "@/core/database/auth-schema.js"
import { user } from "@/core/database/auth-schema.js"

export const authServer = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: false,
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
        console.log(`[magic-link] ${email} -> ${url}`)
      },
    }),
  ],
})
