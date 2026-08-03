import { describe, expect, it } from "vitest"
import app from "@/api/app.js"
import { db } from "@/core/database/index.js"
import { session, verification } from "@/core/database/schemas/index.js"
import { createTestIp, insertTestUser } from "@tests/helpers/index.js"

const SESSION_COOKIE_NAME = "better-auth.session_token"

async function signInWithMagicLink(email: string) {
  await app.request("/api/auth/sign-in/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": createTestIp() },
    body: JSON.stringify({ email }),
  })
  const [verificationRow] = await db.select().from(verification)
  const response = await app.request(
    `/api/auth/magic-link/verify?token=${verificationRow.identifier}&callbackURL=/`,
    { headers: { "x-forwarded-for": createTestIp() }, redirect: "manual" },
  )
  return response.headers.get("set-cookie")!.split(";")[0]
}

function requestSignOut(cookie: string) {
  return app.request("/api/auth/sign-out", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", "x-forwarded-for": createTestIp() },
  })
}

describe("POST /api/auth/sign-out", () => {
  it("reports a successful sign-out", async () => {
    const requestUser = await insertTestUser()
    const sessionCookie = await signInWithMagicLink(requestUser.email)

    const response = await requestSignOut(sessionCookie)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })

  it("expires the session cookie", async () => {
    const requestUser = await insertTestUser()
    const sessionCookie = await signInWithMagicLink(requestUser.email)

    const response = await requestSignOut(sessionCookie)

    const setCookie = response.headers.get("set-cookie") ?? ""
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=;`)
    expect(setCookie).toContain("Max-Age=0")
  })

  it("removes the session row", async () => {
    const requestUser = await insertTestUser()
    const sessionCookie = await signInWithMagicLink(requestUser.email)

    await requestSignOut(sessionCookie)

    expect(await db.select().from(session)).toHaveLength(0)
  })

  it("makes the signed-out cookie unusable on an api request", async () => {
    const requestUser = await insertTestUser()
    const sessionCookie = await signInWithMagicLink(requestUser.email)
    expect(
      (await app.request("/api/device-types", { headers: { cookie: sessionCookie } })).status,
    ).toBe(200)

    await requestSignOut(sessionCookie)

    const response = await app.request("/api/device-types", { headers: { cookie: sessionCookie } })
    expect(response.status).toBe(401)
  })
})
