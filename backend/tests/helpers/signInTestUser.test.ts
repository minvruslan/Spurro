import { call, ORPCError } from "@orpc/server"
import { describe, expect, it } from "vitest"
import { deviceTypeRouter } from "@/api/modules/device-type/index.js"
import { signInTestUser } from "./signInTestUser.js"
import { insertTestUser } from "./insertTestUser.js"

describe("signInTestUser", () => {
  it("authenticates a route call", async () => {
    const insertedUser = await insertTestUser()
    const headers = await signInTestUser(insertedUser)
    const deviceTypes = await call(deviceTypeRouter.getDeviceTypes, undefined, {
      context: { headers },
    })
    expect(Array.isArray(deviceTypes)).toBe(true)
  })

  it("route call without session headers is rejected as UNAUTHORIZED", async () => {
    await expect(
      call(deviceTypeRouter.getDeviceTypes, undefined, { context: { headers: new Headers() } }),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "UNAUTHORIZED")
  })
})
