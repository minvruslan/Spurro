import { randomUUID } from "node:crypto"
import { call } from "@orpc/server"
import { makeSignature } from "better-auth/crypto"

import { describe, expect, it } from "vitest"
import { deviceTypeRouter } from "@/api/modules/device-type/index.js"
import { protocolRouter } from "@/api/modules/protocol/index.js"
import { authServer } from "@/core/auth-server/index.js"
import { db } from "@/core/database/index.js"
import { session } from "@/core/database/schemas/index.js"
import { expectOrpcError } from "@tests/assertions/index.js"
import { insertTestSession, insertTestUser } from "@tests/helpers/index.js"

function callCarrierRoute(headers: Headers) {
  return call(deviceTypeRouter.getDeviceTypes, undefined, { context: { headers } })
}

async function createCookieHeaders(cookieValue: string) {
  const authContext = await authServer.$context
  return new Headers({ cookie: `${authContext.authCookies.sessionToken.name}=${cookieValue}` })
}

async function insertSessionToken(userId: string) {
  const token = randomUUID()
  await db.insert(session).values({
    id: `test-session-${token}`,
    token,
    userId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    updatedAt: new Date(),
  })
  return token
}

describe("authorized", () => {
  it("allows a valid session", async () => {
    const sessionUser = await insertTestUser()
    const headers = await insertTestSession(sessionUser)

    await expect(callCarrierRoute(headers)).resolves.toBeDefined()
  })

  it("rejects a garbage cookie value", async () => {
    await expectOrpcError(callCarrierRoute(await createCookieHeaders("garbage")), "UNAUTHORIZED")
  })

  it("rejects an unsigned token of an existing session", async () => {
    const sessionUser = await insertTestUser()
    const token = await insertSessionToken(sessionUser.id)

    await expectOrpcError(callCarrierRoute(await createCookieHeaders(token)), "UNAUTHORIZED")
  })

  it("rejects an existing session token signed with a wrong secret", async () => {
    const sessionUser = await insertTestUser()
    const token = await insertSessionToken(sessionUser.id)
    const forgedSignature = await makeSignature(token, "wrong-secret")

    await expectOrpcError(
      callCarrierRoute(await createCookieHeaders(`${token}.${forgedSignature}`)),
      "UNAUTHORIZED",
    )
  })

  it("rejects a correctly signed token that has no session", async () => {
    const authContext = await authServer.$context
    const token = randomUUID()
    const signature = await makeSignature(token, authContext.secret)

    await expectOrpcError(
      callCarrierRoute(await createCookieHeaders(`${token}.${signature}`)),
      "UNAUTHORIZED",
    )
  })

  it("rejects an expired session", async () => {
    const sessionUser = await insertTestUser()
    const headers = await insertTestSession(sessionUser, {
      expiresAt: new Date(Date.now() - 60 * 1000),
    })

    await expectOrpcError(callCarrierRoute(headers), "UNAUTHORIZED")
  })

  it("rejects a session of a banned user", async () => {
    const sessionUser = await insertTestUser({ banned: true })
    const headers = await insertTestSession(sessionUser)

    await expectOrpcError(callCarrierRoute(headers), "UNAUTHORIZED")
  })

  it("rejects a session of a user with an active temporary ban", async () => {
    const sessionUser = await insertTestUser({
      banned: true,
      banExpires: new Date(Date.now() + 60 * 60 * 1000),
    })
    const headers = await insertTestSession(sessionUser)

    await expectOrpcError(callCarrierRoute(headers), "UNAUTHORIZED")
  })

  it("allows a user whose temporary ban has expired", async () => {
    const sessionUser = await insertTestUser({
      banned: true,
      banExpires: new Date(Date.now() - 60 * 1000),
    })
    const headers = await insertTestSession(sessionUser)
    await expect(callCarrierRoute(headers)).resolves.toBeDefined()
  })

  it("forbids a non-admin user on an admin route with FORBIDDEN", async () => {
    const sessionUser = await insertTestUser()
    const headers = await insertTestSession(sessionUser)

    await expectOrpcError(
      call(protocolRouter.getProtocols, undefined, { context: { headers } }),
      "FORBIDDEN",
    )
  })

  it("allows an admin on an admin route", async () => {
    const sessionUser = await insertTestUser({ role: "admin" })
    const headers = await insertTestSession(sessionUser)

    await expect(
      call(protocolRouter.getProtocols, undefined, { context: { headers } }),
    ).resolves.toBeDefined()
  })
})
