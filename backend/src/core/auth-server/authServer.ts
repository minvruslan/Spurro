import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, magicLink } from "better-auth/plugins"
import { eq } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import * as schema from "@/core/database/schemas/authSchema.js"
import { user } from "@/core/database/schemas/authSchema.js"
import { sendMagicLinkEmail } from "@/core/mailer/index.js"
import { env } from "@/core/env/index.js"
import { authLogger } from "@/core/logger/index.js"

const MAGIC_LINK_LIFETIME_SECONDS = 300
const SESSION_LIFETIME_SECONDS = 604800

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
  logger: {
    // better-auth routes its own error logs to the global console logger when level is
    // "error", "warn" or "debug"; "info" keeps every log inside the log callback below.
    level: "info",
    log: (level, message, ...args) => authLogger[level]({ args }, message),
  },
  session: {
    expiresIn: SESSION_LIFETIME_SECONDS,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
    },
    // better-auth silently skips origin and callbackURL checks when NODE_ENV=test; pinning
    // the flag keeps tests running the same CSRF protection as production.
    disableOriginCheck: false,
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
      expiresIn: MAGIC_LINK_LIFETIME_SECONDS,
      sendMagicLink: async ({ email, url }) => {
        const [existing] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, email.toLowerCase()))
          .limit(1)
        if (!existing) return
        await sendMagicLinkEmail(email, url)
      },
    }),
  ],
})
