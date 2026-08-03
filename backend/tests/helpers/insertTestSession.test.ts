import { call } from "@orpc/server"
import { describe, expect, it } from "vitest"
import app from "@/api/app.js"
import { deviceTypeRouter } from "@/api/modules/device-type/index.js"
import { db } from "@/core/database/index.js"
import { verification } from "@/core/database/schemas/index.js"
import { expectOrpcError } from "@tests/assertions/index.js"
import { createTestIp } from "./createTestIp.js"
import { insertTestSession } from "./insertTestSession.js"
import { insertTestUser } from "./insertTestUser.js"

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

describe("insertTestSession", () => {
  it("authenticates a route call", async () => {
    const insertedUser = await insertTestUser()
    const headers = await insertTestSession(insertedUser)
    const deviceTypes = await call(deviceTypeRouter.getDeviceTypes, undefined, {
      context: { headers },
    })
    expect(Array.isArray(deviceTypes)).toBe(true)
  })

  it("produces a cookie indistinguishable from one issued by a real magic link sign-in", async () => {
    const insertedUser = await insertTestUser()
    const signedInUser = await insertTestUser()
    const insertedCookie = (await insertTestSession(insertedUser)).get("cookie")
    const signedInCookie = await signInWithMagicLink(signedInUser.email)

    const [insertedCookieName, insertedCookieValue] = insertedCookie!.split("=")
    const [signedInCookieName, signedInCookieValue] = signedInCookie.split("=")
    expect(insertedCookieName).toBe(signedInCookieName)
    expect(insertedCookieValue.split(".")).toHaveLength(
      decodeURIComponent(signedInCookieValue).split(".").length,
    )
    const response = await app.request("/api/device-types", {
      headers: { cookie: insertedCookie! },
    })
    expect(response.status).toBe(200)
  })

  it("route call without session headers is rejected as UNAUTHORIZED", async () => {
    await expectOrpcError(
      call(deviceTypeRouter.getDeviceTypes, undefined, { context: { headers: new Headers() } }),
      "UNAUTHORIZED",
    )
  })
})
