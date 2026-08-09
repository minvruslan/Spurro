import { describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { db } from "@/core/database/index.js"
import { verification } from "@/core/database/schemas/index.js"
import { sendMagicLinkEmail } from "@/core/mailer/index.js"
import { createTestEmail, createTestIp, insertTestUser } from "@tests/helpers/index.js"

const MAGIC_LINK_LIFETIME_SECONDS = 300

async function requestMagicLink(body: unknown, clientIp: string) {
  return app.request("/api/auth/sign-in/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": clientIp },
    body: JSON.stringify(body),
  })
}

describe("POST /api/auth/sign-in/magic-link", () => {
  it("accepts a magic link request for a known user", async () => {
    const requestUser = await insertTestUser()

    const response = await requestMagicLink({ email: requestUser.email }, createTestIp())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: true })
  })

  it("stores a verification row carrying the requested email", async () => {
    const requestUser = await insertTestUser()

    await requestMagicLink({ email: requestUser.email }, createTestIp())

    const verificationRows = await db.select().from(verification)
    expect(verificationRows).toHaveLength(1)
    expect(JSON.parse(verificationRows[0].value)).toEqual({ email: requestUser.email })
  })

  it("stores a verification row expiring in five minutes", async () => {
    const requestUser = await insertTestUser()
    const beforeRequest = Date.now()

    await requestMagicLink({ email: requestUser.email }, createTestIp())

    const afterRequest = Date.now()
    const [verificationRow] = await db.select().from(verification)
    const expiresAtMs = verificationRow.expiresAt.getTime()
    expect(expiresAtMs).toBeGreaterThanOrEqual(beforeRequest + MAGIC_LINK_LIFETIME_SECONDS * 1000)
    expect(expiresAtMs).toBeLessThanOrEqual(afterRequest + MAGIC_LINK_LIFETIME_SECONDS * 1000)
  })

  it("sends the magic link to the requested email", async () => {
    const requestUser = await insertTestUser()

    await requestMagicLink({ email: requestUser.email }, createTestIp())

    expect(sendMagicLinkEmail).toHaveBeenCalledTimes(1)
    const [sentEmail, sentUrl] = vi.mocked(sendMagicLinkEmail).mock.calls[0]
    expect(sentEmail).toBe(requestUser.email)
    expect(sentUrl).toContain("/api/auth/magic-link/verify?token=")
  })

  it("sends the magic link when the email is requested in a different letter case", async () => {
    const requestUser = await insertTestUser()

    await requestMagicLink({ email: requestUser.email.toUpperCase() }, createTestIp())

    expect(sendMagicLinkEmail).toHaveBeenCalledTimes(1)
  })

  it("sends no magic link for an unknown email", async () => {
    const response = await requestMagicLink({ email: createTestEmail() }, createTestIp())

    expect(response.status).toBe(200)
    expect(sendMagicLinkEmail).not.toHaveBeenCalled()
  })

  it("answers an unknown email exactly as a known one", async () => {
    const requestUser = await insertTestUser()

    const knownEmailResponse = await requestMagicLink({ email: requestUser.email }, createTestIp())

    const unknownEmailResponse = await requestMagicLink(
      { email: createTestEmail() },
      createTestIp(),
    )

    expect(unknownEmailResponse.status).toBe(knownEmailResponse.status)
    expect(await unknownEmailResponse.json()).toEqual(await knownEmailResponse.json())
  })

  it("rejects a request without an email", async () => {
    const response = await requestMagicLink({}, createTestIp())

    expect(response.status).toBe(400)
  })

  it("rejects a malformed email", async () => {
    const response = await requestMagicLink({ email: "not-an-email" }, createTestIp())

    expect(response.status).toBe(400)
  })

  it("rate-limits a fourth request from the same client ip", async () => {
    const requestUser = await insertTestUser()
    const clientIp = createTestIp()

    const statuses: number[] = []
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await requestMagicLink({ email: requestUser.email }, clientIp)
      statuses.push(response.status)
    }

    expect(statuses).toEqual([200, 200, 200, 429])
  })

  it("counts the rate limit per client ip taken from x-forwarded-for", async () => {
    const requestUser = await insertTestUser()
    const exhaustedClientIp = createTestIp()
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await requestMagicLink({ email: requestUser.email }, exhaustedClientIp)
    }

    const otherClientResponse = await requestMagicLink({ email: requestUser.email }, createTestIp())

    expect(otherClientResponse.status).toBe(200)
  })
})
