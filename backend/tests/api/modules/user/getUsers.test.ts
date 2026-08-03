import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { UserSchema } from "@spurro/api-contract"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { userRouter } from "@/api/modules/user/index.js"
import { findUsers } from "@/api/modules/user/queries/findUsers.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import {
  config,
  deviceType,
  endpoint,
  protocol,
  server,
  user,
} from "@/core/database/schemas/index.js"
import {
  insertTestConfig,
  insertTestConfigLimit,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestUser,
  signInTestUser,
} from "../../../helpers/index.js"

vi.mock("@/api/modules/user/queries/findUsers.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/api/modules/user/queries/findUsers.js")>()
  return { findUsers: vi.fn(original.findUsers) }
})

const getUsers = (headers: Headers) =>
  call(userRouter.getUsers, undefined, { context: { headers } })

async function adminHeaders() {
  const requestUser = await insertTestUser({ role: "admin" })
  return signInTestUser(requestUser)
}

async function insertConfigInfrastructure() {
  const configProtocol = await insertTestProtocol()
  const configServer = await insertTestServer()
  const configEndpoint = await insertTestEndpoint({
    serverId: configServer.id,
    protocolId: configProtocol.id,
  })
  const [configDeviceType] = await db.select().from(deviceType).limit(1)
  return { configEndpoint, configDeviceType }
}

describe("GET /users", () => {
  beforeEach(async () => {
    await db.delete(config)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
    await db.delete(deviceType)
    await bootstrapDeviceTypes()
  })

  it("returns all users matching the contract schema", async () => {
    const firstUser = await insertTestUser()
    const secondUser = await insertTestUser()
    const users = await getUsers(await adminHeaders())

    const parsed = z.array(UserSchema).parse(users)
    const parsedIds = parsed.map((entry) => entry.id)
    expect(parsedIds).toContain(firstUser.id)
    expect(parsedIds).toContain(secondUser.id)
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const listedUser = await insertTestUser()
    await insertTestConfigLimit({ userId: listedUser.id })
    const users = await getUsers(await adminHeaders())

    const entries = users.filter((entry) => entry.id === listedUser.id)
    expect(entries).toHaveLength(1)
    for (const entry of entries) {
      expect(Object.keys(entry).sort()).toEqual([
        "banReason",
        "banned",
        "createdAt",
        "email",
        "id",
        "limits",
        "name",
        "role",
      ])
      expect(entry.limits).toHaveLength(1)
      for (const limit of entry.limits) {
        expect(Object.keys(limit).sort()).toEqual([
          "createdAt",
          "id",
          "maxCount",
          "protocolFamily",
          "updatedAt",
          "used",
        ])
      }
    }
  })

  it("omits users with role admin including the requesting admin from the list", async () => {
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await signInTestUser(adminUser)
    const otherAdminUser = await insertTestUser({ role: "admin" })
    const ordinaryUser = await insertTestUser()
    const users = await getUsers(headers)

    const listedIds = users.map((entry) => entry.id)
    expect(listedIds).toContain(ordinaryUser.id)
    expect(listedIds).not.toContain(adminUser.id)
    expect(listedIds).not.toContain(otherAdminUser.id)
  })

  it("returns an empty array when only admin users exist", async () => {
    await db.delete(user)
    const users = await getUsers(await adminHeaders())

    expect(users).toEqual([])
  })

  it("returns a user with null role, banned and banReason parsing against the schema", async () => {
    const nullFieldsUser = await insertTestUser({ role: null, banned: null, banReason: null })
    const users = await getUsers(await adminHeaders())

    const entries = users.filter((entry) => entry.id === nullFieldsUser.id)
    expect(entries).toHaveLength(1)
    for (const entry of entries) {
      const parsed = UserSchema.parse(entry)
      expect(parsed.role).toBeNull()
      expect(parsed.banned).toBeNull()
      expect(parsed.banReason).toBeNull()
    }
  })

  it("returns a banned user with banned and banReason populated", async () => {
    const bannedUser = await insertTestUser({ banned: true, banReason: "Violation of terms" })
    const users = await getUsers(await adminHeaders())

    const entries = users.filter((entry) => entry.id === bannedUser.id)
    expect(entries).toHaveLength(1)
    for (const entry of entries) {
      const parsed = UserSchema.parse(entry)
      expect(parsed.banned).toBe(true)
      expect(parsed.banReason).toBe("Violation of terms")
    }
  })

  it("returns an empty limits array for a user without config limits", async () => {
    const unlimitedUser = await insertTestUser()
    const users = await getUsers(await adminHeaders())

    const entries = users.filter((entry) => entry.id === unlimitedUser.id)
    expect(entries).toHaveLength(1)
    for (const entry of entries) {
      expect(entry.limits).toEqual([])
    }
  })

  it("returns each limit with used counting the user's slot-reserving configs of the matching protocol family", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const limitedUser = await insertTestUser()
    await insertTestConfigLimit({ userId: limitedUser.id, maxCount: 5 })
    for (const status of ["active", "pending", "deleting", "deleted"] as const) {
      await insertTestConfig({
        userId: limitedUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status,
      })
    }
    const users = await getUsers(await adminHeaders())

    const entries = users.filter((entry) => entry.id === limitedUser.id)
    expect(entries).toHaveLength(1)
    for (const entry of entries) {
      expect(entry.limits).toHaveLength(1)
      for (const limit of entry.limits) {
        expect(limit.protocolFamily).toBe("amneziawg")
        expect(limit.maxCount).toBe(5)
        expect(limit.used).toBe(2)
      }
    }
  })

  it("does not count another user's configs in the used value", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const limitedUser = await insertTestUser()
    const otherUser = await insertTestUser()
    await insertTestConfigLimit({ userId: limitedUser.id, maxCount: 5 })
    await insertTestConfig({
      userId: limitedUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    await insertTestConfig({
      userId: otherUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    await insertTestConfig({
      userId: otherUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const users = await getUsers(await adminHeaders())

    const entries = users.filter((entry) => entry.id === limitedUser.id)
    expect(entries).toHaveLength(1)
    for (const entry of entries) {
      expect(entry.limits).toHaveLength(1)
      for (const limit of entry.limits) {
        expect(limit.used).toBe(1)
      }
    }
  })

  it("returns a limit with used exceeding maxCount as-is parsing against the contract schema", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const overLimitUser = await insertTestUser()
    await insertTestConfigLimit({ userId: overLimitUser.id, maxCount: 1 })
    await insertTestConfig({
      userId: overLimitUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    await insertTestConfig({
      userId: overLimitUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const users = await getUsers(await adminHeaders())

    const entries = users.filter((entry) => entry.id === overLimitUser.id)
    expect(entries).toHaveLength(1)
    for (const entry of entries) {
      const parsed = UserSchema.parse(entry)
      expect(parsed.limits).toHaveLength(1)
      for (const limit of parsed.limits) {
        expect(limit.maxCount).toBe(1)
        expect(limit.used).toBe(2)
      }
    }
  })

  it("omits usage of a protocol family that has no config limit row from the user's limits", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const unlimitedUser = await insertTestUser()
    await insertTestConfig({
      userId: unlimitedUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const users = await getUsers(await adminHeaders())

    const entries = users.filter((entry) => entry.id === unlimitedUser.id)
    expect(entries).toHaveLength(1)
    for (const entry of entries) {
      expect(entry.limits).toEqual([])
    }
  })

  it("returns entries ordered by name ascending", async () => {
    const bravoUser = await insertTestUser({ name: `Bravo User ${randomUUID()}` })
    const charlieUser = await insertTestUser({ name: `Charlie User ${randomUUID()}` })
    const alphaUser = await insertTestUser({ name: `Alpha User ${randomUUID()}` })
    const orderedUserIds = [alphaUser.id, bravoUser.id, charlieUser.id]
    const users = await getUsers(await adminHeaders())

    const listedIds = users
      .filter((entry) => orderedUserIds.includes(entry.id))
      .map((entry) => entry.id)
    expect(listedIds).toEqual(orderedUserIds)
  })

  it("rejects an ordinary user with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(getUsers(headers)).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "FORBIDDEN",
    )
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expect(getUsers(new Headers())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the user query throws", async () => {
      vi.mocked(findUsers).mockRejectedValueOnce(new Error("Query failure"))

      const response = await app.request("/api/users", {
        headers: await adminHeaders(),
      })
      expect(response.status).toBe(500)
    })
  })
})
