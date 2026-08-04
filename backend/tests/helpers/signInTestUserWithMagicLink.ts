import app from "@/api/app.js"
import { db } from "@/core/database/index.js"
import { verification } from "@/core/database/schemas/index.js"
import { env } from "@/core/env/index.js"
import { createTestIp } from "./createTestIp.js"

export async function signInTestUserWithMagicLink(email: string) {
  await app.request("/api/auth/sign-in/magic-link", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": createTestIp(),
      origin: env.BETTER_AUTH_URL,
    },
    body: JSON.stringify({ email }),
  })
  const verificationRows = await db.select().from(verification)
  const verificationRow = verificationRows.find((row) => row.value.includes(email))
  if (!verificationRow) throw new Error(`No verification row found for ${email}.`)
  const response = await app.request(
    `/api/auth/magic-link/verify?token=${verificationRow.identifier}&callbackURL=/`,
    { headers: { "x-forwarded-for": createTestIp() }, redirect: "manual" },
  )
  const setCookie = response.headers.get("set-cookie")
  if (!setCookie) throw new Error(`Magic link sign-in for ${email} set no session cookie.`)
  return setCookie.split(";")[0]
}
