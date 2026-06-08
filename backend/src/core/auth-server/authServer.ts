import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, magicLink } from "better-auth/plugins"
import { db } from "@/core/database/index.js"
import * as schema from "@/core/database/auth-schema.js"

export const authServer = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    admin(),
    magicLink({
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        // TODO: wire up a real email provider.
        console.log(`[magic-link] ${email} -> ${url}`)
      },
    }),
  ],
})
