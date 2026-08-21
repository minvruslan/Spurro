import { eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { db } from "@/core/database/index.js"
import { session, user, verification } from "@/core/database/schemas/index.js"
import { env } from "@/core/env/index.js"
import { sendMagicLinkEmail } from "@/core/mailer/index.js"
import { createTestEmail, createTestIp, insertTestUser } from "@tests/helpers/index.js"

const SESSION_COOKIE_NAME = "better-auth.session_token"
const SESSION_LIFETIME_SECONDS = 604800

async function requestMagicLinkToken(email: string) {
  await app.request("/api/auth/sign-in/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": createTestIp() },
    body: JSON.stringify({ email }),
  })
  const [verificationRow] = await db.select().from(verification)
  return verificationRow.identifier
}

function verifyMagicLink(token: string) {
  return app.request(`/api/auth/magic-link/verify?token=${token}&callbackURL=/`, {
    headers: { "x-forwarded-for": createTestIp() },
    redirect: "manual",
  })
}

function readSessionCookie(response: Response) {
  const setCookie = response.headers.get("set-cookie")
  if (!setCookie?.includes(`${SESSION_COOKIE_NAME}=`)) return null
  const [cookiePair] = setCookie.split(";")
  return cookiePair.startsWith(`${SESSION_COOKIE_NAME}=`) ? cookiePair : null
}

describe("GET /api/auth/magic-link/verify", () => {
  it("signs in with the token carried by the emailed link", async () => {
    const requestUser = await insertTestUser()
    await requestMagicLinkToken(requestUser.email)
    const [, sentUrl] = vi.mocked(sendMagicLinkEmail).mock.calls[0]
    const sentLink = new URL(sentUrl)
    expect(sentLink.origin).toBe(env.BETTER_AUTH_URL)
    expect(sentLink.pathname).toBe("/login/verify")
    const sentToken = new URLSearchParams(sentLink.hash.slice(1)).get("token")

    const response = await verifyMagicLink(sentToken ?? "")

    expect(response.status).toBe(302)
    expect(new URL(response.headers.get("location") ?? "").searchParams.get("error")).toBeNull()
    expect(readSessionCookie(response)).not.toBeNull()
    const sessionRows = await db.select().from(session).where(eq(session.userId, requestUser.id))
    expect(sessionRows).toHaveLength(1)
  })

  it("redirects to the callback url without an error", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)

    const response = await app.request(
      `/api/auth/magic-link/verify?token=${token}&callbackURL=${encodeURIComponent("/app/configs")}`,
      { headers: { "x-forwarded-for": createTestIp() }, redirect: "manual" },
    )

    expect(response.status).toBe(302)
    const location = new URL(response.headers.get("location") ?? "")
    expect(location.searchParams.get("error")).toBeNull()
    expect(`${location.origin}${location.pathname}`).toBe(`${env.BETTER_AUTH_URL}/app/configs`)
  })

  it("sets a signed session cookie", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)

    const response = await verifyMagicLink(token)

    const sessionCookie = readSessionCookie(response)
    expect(sessionCookie).not.toBeNull()
    const cookieValue = decodeURIComponent(sessionCookie!.split("=")[1])
    expect(cookieValue.split(".")).toHaveLength(2)
  })

  it("sets the session cookie with HttpOnly, SameSite=Lax and Path=/", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)

    const response = await verifyMagicLink(token)

    const setCookie = response.headers.get("set-cookie") ?? ""
    const cookieAttributes = setCookie.split(";").map((part) => part.trim().toLowerCase())
    expect(cookieAttributes).toContain("httponly")
    expect(cookieAttributes).toContain("samesite=lax")
    expect(cookieAttributes).toContain("path=/")
    expect(cookieAttributes).toContain(`max-age=${SESSION_LIFETIME_SECONDS}`)
  })

  it("persists a session row expiring in seven days for the signed-in user", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)
    const beforeVerify = Date.now()

    await verifyMagicLink(token)

    const afterVerify = Date.now()
    const sessionRows = await db.select().from(session).where(eq(session.userId, requestUser.id))
    expect(sessionRows).toHaveLength(1)
    const expiresAtMs = sessionRows[0].expiresAt.getTime()
    expect(expiresAtMs).toBeGreaterThanOrEqual(beforeVerify + SESSION_LIFETIME_SECONDS * 1000)
    expect(expiresAtMs).toBeLessThanOrEqual(afterVerify + SESSION_LIFETIME_SECONDS * 1000)
  })

  it("signs in the user when the magic link was requested in a different letter case", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email.toUpperCase())

    const response = await verifyMagicLink(token)

    expect(readSessionCookie(response)).not.toBeNull()
    const sessionRows = await db.select().from(session).where(eq(session.userId, requestUser.id))
    expect(sessionRows).toHaveLength(1)
  })

  it("issues a cookie that authorizes an api request", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)
    const sessionCookie = readSessionCookie(await verifyMagicLink(token))

    const response = await app.request("/api/device-types", {
      headers: { cookie: sessionCookie ?? "" },
    })

    expect(response.status).toBe(200)
  })

  it("marks the user email as verified", async () => {
    const requestUser = await insertTestUser({ emailVerified: false })
    const token = await requestMagicLinkToken(requestUser.email)

    await verifyMagicLink(token)

    const userRows = await db.select().from(user).where(eq(user.id, requestUser.id))
    expect(userRows[0].emailVerified).toBe(true)
  })

  it("consumes the verification row", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)

    await verifyMagicLink(token)

    expect(await db.select().from(verification)).toHaveLength(0)
  })

  it("rejects the same token on a second use", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)
    await verifyMagicLink(token)

    const response = await verifyMagicLink(token)

    expect(new URL(response.headers.get("location") ?? "").searchParams.get("error")).toBe(
      "INVALID_TOKEN",
    )
    expect(readSessionCookie(response)).toBeNull()
  })

  it("creates no second session on a replayed token", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)
    await verifyMagicLink(token)

    await verifyMagicLink(token)

    const sessionRows = await db.select().from(session).where(eq(session.userId, requestUser.id))
    expect(sessionRows).toHaveLength(1)
  })

  it("creates exactly one session when the link is opened twice in parallel", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)

    const responses = await Promise.all([verifyMagicLink(token), verifyMagicLink(token)])

    const successResponses = responses.filter(
      (response) =>
        new URL(response.headers.get("location") ?? "").searchParams.get("error") === null,
    )
    expect(successResponses).toHaveLength(1)
    const sessionRows = await db.select().from(session).where(eq(session.userId, requestUser.id))
    expect(sessionRows).toHaveLength(1)
  })

  it("rejects a callback url outside the app origin", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)

    const response = await app.request(
      `/api/auth/magic-link/verify?token=${token}&callbackURL=${encodeURIComponent("https://evil.example/steal")}`,
      { headers: { "x-forwarded-for": createTestIp() }, redirect: "manual" },
    )

    expect(response.status).toBe(403)
    expect(readSessionCookie(response)).toBeNull()
    expect(await db.select().from(session)).toHaveLength(0)
  })

  it("rejects an unknown token", async () => {
    const response = await verifyMagicLink("unknown-token")

    expect(new URL(response.headers.get("location") ?? "").searchParams.get("error")).toBe(
      "INVALID_TOKEN",
    )
    expect(await db.select().from(session)).toHaveLength(0)
  })

  it("rejects an expired token", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)
    await db
      .update(verification)
      .set({ expiresAt: new Date(Date.now() - 60 * 1000) })
      .where(eq(verification.identifier, token))

    const response = await verifyMagicLink(token)

    expect(new URL(response.headers.get("location") ?? "").searchParams.get("error")).toBe(
      "INVALID_TOKEN",
    )
    expect(readSessionCookie(response)).toBeNull()
    expect(await db.select().from(session)).toHaveLength(0)
    expect(await db.select().from(verification)).toHaveLength(0)
  })

  it("refuses to sign up a token issued for an email without a user", async () => {
    const token = await requestMagicLinkToken(createTestEmail())

    const response = await verifyMagicLink(token)

    expect(new URL(response.headers.get("location") ?? "").searchParams.get("error")).toBe(
      "new_user_signup_disabled",
    )
    expect(readSessionCookie(response)).toBeNull()
    expect(await db.select().from(user)).toHaveLength(0)
  })

  it("refuses a banned user with 403 and no cookie", async () => {
    const bannedUser = await insertTestUser({ banned: true })
    const token = await requestMagicLinkToken(bannedUser.email)

    const response = await verifyMagicLink(token)

    expect(response.status).toBe(403)
    expect(readSessionCookie(response)).toBeNull()
    expect(await db.select().from(session)).toHaveLength(0)
  })
})
