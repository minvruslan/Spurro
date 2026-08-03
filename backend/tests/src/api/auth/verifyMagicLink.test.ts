import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import app from "@/api/app.js"
import { db } from "@/core/database/index.js"
import { session, user, verification } from "@/core/database/schemas/index.js"
import { createTestEmail, createTestIp, insertTestUser } from "@tests/helpers/index.js"

const SESSION_COOKIE_NAME = "better-auth.session_token"

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
  it("redirects to the callback url without an error", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)

    const response = await verifyMagicLink(token)

    expect(response.status).toBe(302)
    expect(new URL(response.headers.get("location") ?? "").searchParams.get("error")).toBeNull()
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

  it("persists a session row for the signed-in user", async () => {
    const requestUser = await insertTestUser()
    const token = await requestMagicLinkToken(requestUser.email)

    await verifyMagicLink(token)

    const sessionRows = await db.select().from(session).where(eq(session.userId, requestUser.id))
    expect(sessionRows).toHaveLength(1)
    expect(sessionRows[0].expiresAt.getTime()).toBeGreaterThan(Date.now())
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

    expect(new URL(response.headers.get("location") ?? "").searchParams.get("error")).not.toBeNull()
    expect(readSessionCookie(response)).toBeNull()
    expect(await db.select().from(session)).toHaveLength(0)
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
