import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { makeSignature } from "better-auth/crypto"
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { deviceTypeRouter } from "@/api/modules/device-type/index.js"
import { authServer } from "@/core/auth-server/index.js"
import { db } from "@/core/database/index.js"
import { session, user } from "@/core/database/schemas/index.js"
import { signInTestUser, insertTestUser } from "../../helpers/index.js"

const callCarrierRoute = (headers: Headers) =>
  call(deviceTypeRouter.getDeviceTypes, undefined, { context: { headers } })

async function cookieHeaders(cookieValue: string) {
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

const expectUnauthorized = async (headers: Headers) => {
  await expect(callCarrierRoute(headers)).rejects.toSatisfy(
    (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
  )
}

describe("authorized", () => {
  it("rejects a garbage cookie value", async () => {
    await expectUnauthorized(await cookieHeaders("garbage"))
  })

  it("rejects an unsigned token of an existing session", async () => {
    const sessionUser = await insertTestUser()
    const token = await insertSessionToken(sessionUser.id)
    await expectUnauthorized(await cookieHeaders(token))
  })

  it("rejects an existing session token signed with a wrong secret", async () => {
    const sessionUser = await insertTestUser()
    const token = await insertSessionToken(sessionUser.id)
    const forgedSignature = await makeSignature(token, "wrong-secret")
    await expectUnauthorized(await cookieHeaders(`${token}.${forgedSignature}`))
  })

  it("rejects a correctly signed token that has no session", async () => {
    const authContext = await authServer.$context
    const token = randomUUID()
    const signature = await makeSignature(token, authContext.secret)
    await expectUnauthorized(await cookieHeaders(`${token}.${signature}`))
  })

  it("rejects an expired session", async () => {
    const sessionUser = await insertTestUser()
    const headers = await signInTestUser(sessionUser, {
      expiresAt: new Date(Date.now() - 60 * 1000),
    })
    await expectUnauthorized(headers)
  })

  it("rejects a session whose user was deleted", async () => {
    const sessionUser = await insertTestUser()
    const headers = await signInTestUser(sessionUser)
    await db.delete(user).where(eq(user.id, sessionUser.id))
    await expectUnauthorized(headers)
  })

  it("rejects a session of a banned user", async () => {
    const sessionUser = await insertTestUser({ banned: true })
    const headers = await signInTestUser(sessionUser)
    await expectUnauthorized(headers)
  })

  it("rejects a session of a user with an active temporary ban", async () => {
    const sessionUser = await insertTestUser({
      banned: true,
      banExpires: new Date(Date.now() + 60 * 60 * 1000),
    })
    const headers = await signInTestUser(sessionUser)
    await expectUnauthorized(headers)
  })

  it("allows a user whose temporary ban has expired", async () => {
    const sessionUser = await insertTestUser({
      banned: true,
      banExpires: new Date(Date.now() - 60 * 1000),
    })
    const headers = await signInTestUser(sessionUser)
    await expect(callCarrierRoute(headers)).resolves.toBeDefined()
  })
  it.todo("forbids a non-admin user on an admin route with FORBIDDEN")
})
