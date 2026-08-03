import { describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { db } from "@/core/database/index.js"
import { verification } from "@/core/database/schemas/index.js"
import { createTestEmail, createTestIp, insertTestUser } from "../../helpers/index.js"

vi.mock("node:fs/promises", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:fs/promises")>()
  return { ...original, writeFile: vi.fn() }
})

async function requestMagicLink(body: unknown, clientIp: string) {
  return app.request("/api/auth/sign-in/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": clientIp },
    body: JSON.stringify(body),
  })
}

async function readSentMagicLinks() {
  const { writeFile } = await import("node:fs/promises")
  return vi.mocked(writeFile).mock.calls.map((writeFileCall) => String(writeFileCall[1]))
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
    expect(verificationRows[0].expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it("sends a link to a known user", async () => {
    const requestUser = await insertTestUser()

    await requestMagicLink({ email: requestUser.email }, createTestIp())

    expect(await readSentMagicLinks()).toHaveLength(1)
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

  it("sends no link to an unknown email", async () => {
    await requestMagicLink({ email: createTestEmail() }, createTestIp())

    expect(await readSentMagicLinks()).toHaveLength(0)
  })

  it("rejects a request without an email", async () => {
    const response = await requestMagicLink({}, createTestIp())

    expect(response.status).toBe(400)
  })

  it("rejects a malformed email", async () => {
    const response = await requestMagicLink({ email: "not-an-email" }, createTestIp())

    expect(response.status).toBe(400)
    expect(await readSentMagicLinks()).toHaveLength(0)
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
