import { randomUUID } from "node:crypto"
import { call } from "@orpc/server"
import { UserSchema } from "@spurro/api-contract"
import { beforeEach, describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { userRouter } from "@/api/modules/user/index.js"
import { findUserById } from "@/api/modules/user/queries/findUserById.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { deviceType, server } from "@/core/database/schemas/index.js"
import { expectOrpcError } from "../../../assertions/index.js"
import {
  insertTestConfig,
  insertTestConfigLimit,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestSession,
  insertTestUser,
  signInTestAdmin,
} from "../../../helpers/index.js"

vi.mock("@/api/modules/user/queries/findUserById.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/user/queries/findUserById.js")>()
  return { findUserById: vi.fn(original.findUserById) }
})

function callGetUser(id: string, headers: Headers) {
  return call(userRouter.getUser, { id }, { context: { headers } })
}

async function insertConfigInfrastructure(
  serverOverrides: Partial<typeof server.$inferInsert> = {},
) {
  const configProtocol = await insertTestProtocol()
  const configServer = await insertTestServer(serverOverrides)
  const configEndpoint = await insertTestEndpoint({
    serverId: configServer.id,
    protocolId: configProtocol.id,
  })
  const [configDeviceType] = await db.select().from(deviceType).limit(1)
  return { configEndpoint, configDeviceType }
}

describe("GET /users/{id}", () => {
  beforeEach(bootstrapDeviceTypes)

  it("returns the requested user matching the contract schema", async () => {
    const requestedUser = await insertTestUser()
    const foundUser = await callGetUser(requestedUser.id, await signInTestAdmin())

    const parsed = UserSchema.parse(foundUser)
    expect(parsed.id).toBe(requestedUser.id)
    expect(parsed.name).toBe(requestedUser.name)
    expect(parsed.email).toBe(requestedUser.email)
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const requestedUser = await insertTestUser()
    await insertTestConfigLimit({ userId: requestedUser.id })
    const foundUser = await callGetUser(requestedUser.id, await signInTestAdmin())

    expect(Object.keys(foundUser).sort()).toEqual([
      "banReason",
      "banned",
      "createdAt",
      "email",
      "id",
      "limits",
      "name",
      "role",
    ])
    expect(foundUser.limits).toHaveLength(1)
    for (const limit of foundUser.limits) {
      expect(Object.keys(limit).sort()).toEqual([
        "createdAt",
        "id",
        "maxCount",
        "protocolFamily",
        "updatedAt",
        "used",
      ])
    }
  })

  it("returns the user's limits with used counting their slot-reserving configs of the matching protocol family", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestedUser = await insertTestUser()
    await insertTestConfigLimit({ userId: requestedUser.id, maxCount: 5 })
    for (const status of ["active", "pending", "deleting", "deleted"] as const) {
      await insertTestConfig({
        userId: requestedUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status,
      })
    }
    const foundUser = await callGetUser(requestedUser.id, await signInTestAdmin())

    expect(foundUser.limits).toHaveLength(1)
    for (const limit of foundUser.limits) {
      expect(limit.protocolFamily).toBe("amneziawg")
      expect(limit.maxCount).toBe(5)
      expect(limit.used).toBe(2)
    }
  })

  it("excludes a pending config older than the reservation window from used", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestedUser = await insertTestUser()
    await insertTestConfigLimit({ userId: requestedUser.id, maxCount: 5 })
    await insertTestConfig({
      userId: requestedUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
      createdAt: new Date(Date.now() - 7 * 60 * 1000),
    })
    const foundUser = await callGetUser(requestedUser.id, await signInTestAdmin())

    expect(foundUser.limits).toHaveLength(1)
    for (const limit of foundUser.limits) {
      expect(limit.used).toBe(0)
    }
  })

  it("returns an empty limits array when the user has no config limits", async () => {
    const requestedUser = await insertTestUser()
    const foundUser = await callGetUser(requestedUser.id, await signInTestAdmin())

    expect(foundUser.limits).toEqual([])
  })

  it("returns a banned user with banned and banReason populated", async () => {
    const bannedUser = await insertTestUser({ banned: true, banReason: "Violation of terms" })
    const foundUser = await callGetUser(bannedUser.id, await signInTestAdmin())

    const parsed = UserSchema.parse(foundUser)
    expect(parsed.banned).toBe(true)
    expect(parsed.banReason).toBe("Violation of terms")
  })

  it("rejects a user with role admin with NOT_FOUND", async () => {
    const adminUser = await insertTestUser({ role: "admin" })

    await expectOrpcError(callGetUser(adminUser.id, await signInTestAdmin()), "NOT_FOUND")
  })

  it("returns a limit with used exceeding maxCount as-is parsing against the contract schema", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestedUser = await insertTestUser()
    await insertTestConfigLimit({ userId: requestedUser.id, maxCount: 1 })
    await insertTestConfig({
      userId: requestedUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    await insertTestConfig({
      userId: requestedUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const foundUser = await callGetUser(requestedUser.id, await signInTestAdmin())

    const parsed = UserSchema.parse(foundUser)
    expect(parsed.limits).toHaveLength(1)
    for (const limit of parsed.limits) {
      expect(limit.maxCount).toBe(1)
      expect(limit.used).toBe(2)
    }
  })

  it("returns a limit with maxCount 0 and a positive used count", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestedUser = await insertTestUser()
    await insertTestConfigLimit({ userId: requestedUser.id, maxCount: 0 })
    await insertTestConfig({
      userId: requestedUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const foundUser = await callGetUser(requestedUser.id, await signInTestAdmin())

    expect(foundUser.limits).toHaveLength(1)
    for (const limit of foundUser.limits) {
      expect(limit.maxCount).toBe(0)
      expect(limit.used).toBe(1)
    }
  })

  it("omits usage of a protocol family that has no config limit row from limits", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestedUser = await insertTestUser()
    await insertTestConfig({
      userId: requestedUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const foundUser = await callGetUser(requestedUser.id, await signInTestAdmin())

    expect(foundUser.limits).toEqual([])
  })

  it("returns a limit for a protocol family with no enabled protocols", async () => {
    await insertTestProtocol({ isEnabled: false })
    const requestedUser = await insertTestUser()
    await insertTestConfigLimit({ userId: requestedUser.id, maxCount: 2 })
    const foundUser = await callGetUser(requestedUser.id, await signInTestAdmin())

    expect(foundUser.limits).toHaveLength(1)
    for (const limit of foundUser.limits) {
      expect(limit.protocolFamily).toBe("amneziawg")
      expect(limit.maxCount).toBe(2)
      expect(limit.used).toBe(0)
    }
  })

  it("counts a banned user's configs in used", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const bannedUser = await insertTestUser({ banned: true, banReason: "Violation of terms" })
    await insertTestConfigLimit({ userId: bannedUser.id, maxCount: 5 })
    await insertTestConfig({
      userId: bannedUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const foundUser = await callGetUser(bannedUser.id, await signInTestAdmin())

    expect(foundUser.limits).toHaveLength(1)
    for (const limit of foundUser.limits) {
      expect(limit.used).toBe(1)
    }
  })

  it("counts non-deleted configs in used even when their server has status deleted", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      status: "deleted",
    })
    const requestedUser = await insertTestUser()
    await insertTestConfigLimit({ userId: requestedUser.id, maxCount: 5 })
    await insertTestConfig({
      userId: requestedUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const foundUser = await callGetUser(requestedUser.id, await signInTestAdmin())

    expect(foundUser.limits).toHaveLength(1)
    for (const limit of foundUser.limits) {
      expect(limit.used).toBe(1)
    }
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    await expectOrpcError(
      callGetUser(`unknown-user-${randomUUID()}`, await signInTestAdmin()),
      "NOT_FOUND",
    )
  })

  it("rejects an empty string id with NOT_FOUND", async () => {
    await expectOrpcError(callGetUser("", await signInTestAdmin()), "NOT_FOUND")
  })

  it("rejects a malformed identifier with NOT_FOUND", async () => {
    await expectOrpcError(callGetUser("%%%not-a-user-id%%%", await signInTestAdmin()), "NOT_FOUND")
  })

  it("rejects an ordinary user requesting another user's record with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const otherUser = await insertTestUser()

    await expectOrpcError(callGetUser(otherUser.id, headers), "FORBIDDEN")
  })

  it("rejects an ordinary user requesting their own record with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(callGetUser(requestUser.id, headers), "FORBIDDEN")
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    const requestedUser = await insertTestUser()

    await expectOrpcError(callGetUser(requestedUser.id, new Headers()), "UNAUTHORIZED")
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the user query throws", async () => {
      const requestedUser = await insertTestUser()
      vi.mocked(findUserById).mockRejectedValueOnce(new Error("Query failure"))

      const response = await app.request(`/api/users/${requestedUser.id}`, {
        headers: await signInTestAdmin(),
      })
      expect(response.status).toBe(500)
    })
  })
})
