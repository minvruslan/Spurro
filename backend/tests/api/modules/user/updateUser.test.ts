import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { UserSchema, type UpsertUser } from "@spurro/api-contract"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { userRouter } from "@/api/modules/user/index.js"
import { updateUser } from "@/api/modules/user/queries/updateUser.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import {
  config,
  configLimit,
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

vi.mock("@/api/modules/user/queries/updateUser.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/api/modules/user/queries/updateUser.js")>()
  return { updateUser: vi.fn(original.updateUser) }
})

const callUpdateUser = (input: unknown, headers: Headers) =>
  call(userRouter.updateUser, input as UpsertUser & { id: string }, { context: { headers } })

async function adminHeaders() {
  const requestUser = await insertTestUser({ role: "admin" })
  return signInTestUser(requestUser)
}

function uniqueEmail() {
  return `updated-user-${randomUUID()}@test.local`
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

const expectBadRequest = async (input: unknown, headers: Headers) => {
  await expect(callUpdateUser(input, headers)).rejects.toSatisfy(
    (error) => error instanceof ORPCError && error.code === "BAD_REQUEST",
  )
}

describe("PUT /users/{id}", () => {
  beforeEach(async () => {
    await db.delete(config)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
    await db.delete(deviceType)
    await bootstrapDeviceTypes()
  })

  it("updates the name and email and returns the user matching the contract schema", async () => {
    const targetUser = await insertTestUser()
    const newEmail = uniqueEmail()
    const updatedUser = await callUpdateUser(
      { id: targetUser.id, name: "Updated Name", email: newEmail },
      await adminHeaders(),
    )

    const parsed = UserSchema.parse(updatedUser)
    expect(parsed.id).toBe(targetUser.id)
    expect(parsed.name).toBe("Updated Name")
    expect(parsed.email).toBe(newEmail)
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const targetUser = await insertTestUser()
    const updatedUser = await callUpdateUser(
      {
        id: targetUser.id,
        name: "Updated Name",
        email: targetUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: 2 }],
      },
      await adminHeaders(),
    )

    expect(Object.keys(updatedUser).sort()).toEqual([
      "banReason",
      "banned",
      "createdAt",
      "email",
      "id",
      "limits",
      "name",
      "role",
    ])
    expect(updatedUser.limits).toHaveLength(1)
    for (const limit of updatedUser.limits) {
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

  it("persists the updated name and email in the database", async () => {
    const targetUser = await insertTestUser()
    const newEmail = uniqueEmail()
    await callUpdateUser(
      { id: targetUser.id, name: "Updated Name", email: newEmail },
      await adminHeaders(),
    )

    const userRows = await db.select().from(user).where(eq(user.id, targetUser.id))
    expect(userRows).toHaveLength(1)
    expect(userRows[0].name).toBe("Updated Name")
    expect(userRows[0].email).toBe(newEmail)
  })

  it("leaves role, banned and banReason unchanged", async () => {
    const targetUser = await insertTestUser({
      role: "user",
      banned: true,
      banReason: "Violation of terms",
    })
    const updatedUser = await callUpdateUser(
      { id: targetUser.id, name: "Updated Name", email: targetUser.email },
      await adminHeaders(),
    )

    const parsed = UserSchema.parse(updatedUser)
    expect(parsed.role).toBe("user")
    expect(parsed.banned).toBe(true)
    expect(parsed.banReason).toBe("Violation of terms")
  })

  it("updates maxCount of an existing limit for the same protocol family", async () => {
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 2 })
    const updatedUser = await callUpdateUser(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: 7 }],
      },
      await adminHeaders(),
    )

    expect(updatedUser.limits).toHaveLength(1)
    for (const limit of updatedUser.limits) {
      expect(limit.protocolFamily).toBe("amneziawg")
      expect(limit.maxCount).toBe(7)
    }
  })

  it("creates a limit for a protocol family the user did not have yet", async () => {
    const targetUser = await insertTestUser()
    const updatedUser = await callUpdateUser(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: 3 }],
      },
      await adminHeaders(),
    )

    expect(updatedUser.limits).toHaveLength(1)
    for (const limit of updatedUser.limits) {
      expect(limit.protocolFamily).toBe("amneziawg")
      expect(limit.maxCount).toBe(3)
      expect(limit.used).toBe(0)
    }
  })

  it("deletes all the user's limits when limits is omitted", async () => {
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 2 })
    const updatedUser = await callUpdateUser(
      { id: targetUser.id, name: targetUser.name, email: targetUser.email },
      await adminHeaders(),
    )

    expect(updatedUser.limits).toEqual([])
  })

  it("deletes the user's limits when an empty limits array is provided", async () => {
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 2 })
    const updatedUser = await callUpdateUser(
      { id: targetUser.id, name: targetUser.name, email: targetUser.email, limits: [] },
      await adminHeaders(),
    )

    expect(updatedUser.limits).toEqual([])
  })

  it("persists the limit changes in the database", async () => {
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 2 })
    await callUpdateUser(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: 9 }],
      },
      await adminHeaders(),
    )

    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, targetUser.id))
    expect(configLimitRows).toHaveLength(1)
    expect(configLimitRows[0].protocolFamily).toBe("amneziawg")
    expect(configLimitRows[0].maxCount).toBe(9)
  })

  it("leaves another user's config limit untouched", async () => {
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 2 })
    const bystanderUser = await insertTestUser()
    const bystanderConfigLimit = await insertTestConfigLimit({
      userId: bystanderUser.id,
      maxCount: 6,
    })

    await callUpdateUser(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: 9 }],
      },
      await adminHeaders(),
    )

    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, bystanderUser.id))
    expect(configLimitRows).toEqual([bystanderConfigLimit])
  })

  it("returns limits with used counting the user's non-deleted configs of the matching protocol family", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    for (const status of ["active", "pending", "deleted"] as const) {
      await insertTestConfig({
        userId: targetUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status,
      })
    }
    const updatedUser = await callUpdateUser(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: 5 }],
      },
      await adminHeaders(),
    )

    expect(updatedUser.limits).toHaveLength(1)
    for (const limit of updatedUser.limits) {
      expect(limit.used).toBe(2)
    }
  })

  it("persists a maxCount lower than the user's current used count", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 5 })
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    await callUpdateUser(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: 1 }],
      },
      await adminHeaders(),
    )

    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, targetUser.id))
    expect(configLimitRows).toHaveLength(1)
    expect(configLimitRows[0].maxCount).toBe(1)
  })

  it("returns the reduced limit with used still exceeding the new maxCount", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 5 })
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const updatedUser = await callUpdateUser(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: 1 }],
      },
      await adminHeaders(),
    )

    const parsed = UserSchema.parse(updatedUser)
    expect(parsed.limits).toHaveLength(1)
    for (const limit of parsed.limits) {
      expect(limit.maxCount).toBe(1)
      expect(limit.used).toBe(2)
    }
  })

  it("keeps the user's configs untouched when their limits are deleted via an empty limits array", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 5 })
    const firstConfig = await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const secondConfig = await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    await callUpdateUser(
      { id: targetUser.id, name: targetUser.name, email: targetUser.email, limits: [] },
      await adminHeaders(),
    )

    const configRows = await db.select().from(config).where(eq(config.userId, targetUser.id))
    expect(configRows.map((row) => row.id).sort()).toEqual([firstConfig.id, secondConfig.id].sort())
    for (const row of configRows) {
      expect(row.status).toBe("active")
    }
  })

  it("rejects updating a user with role admin with NOT_FOUND", async () => {
    const adminUser = await insertTestUser({ role: "admin" })

    await expect(
      callUpdateUser(
        { id: adminUser.id, name: "Updated Name", email: adminUser.email },
        await adminHeaders(),
      ),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "NOT_FOUND")
  })

  it("accepts updating the email to its current value", async () => {
    const targetUser = await insertTestUser()
    const updatedUser = await callUpdateUser(
      { id: targetUser.id, name: "Updated Name", email: targetUser.email },
      await adminHeaders(),
    )

    const parsed = UserSchema.parse(updatedUser)
    expect(parsed.email).toBe(targetUser.email)
    expect(parsed.name).toBe("Updated Name")
  })

  it("accepts updating the email to its current value differing only in case", async () => {
    const targetUser = await insertTestUser()
    const caseVariantEmail = targetUser.email.toUpperCase()
    const updatedUser = await callUpdateUser(
      { id: targetUser.id, name: "Updated Name", email: caseVariantEmail },
      await adminHeaders(),
    )

    const parsed = UserSchema.parse(updatedUser)
    expect(parsed.email).toBe(caseVariantEmail)
    expect(parsed.name).toBe("Updated Name")
  })

  it("rejects updating the email to another user's email with EMAIL_TAKEN", async () => {
    const targetUser = await insertTestUser()
    const otherUser = await insertTestUser()

    await expect(
      callUpdateUser(
        { id: targetUser.id, name: targetUser.name, email: otherUser.email },
        await adminHeaders(),
      ),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "EMAIL_TAKEN")
  })

  it("rejects updating the email to another user's email differing only in case with EMAIL_TAKEN", async () => {
    const targetUser = await insertTestUser()
    const otherUser = await insertTestUser()

    await expect(
      callUpdateUser(
        { id: targetUser.id, name: targetUser.name, email: otherUser.email.toUpperCase() },
        await adminHeaders(),
      ),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "EMAIL_TAKEN")
  })

  it("persists neither user nor limit changes when the email is taken", async () => {
    const targetUser = await insertTestUser()
    const otherUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 2 })

    await callUpdateUser(
      {
        id: targetUser.id,
        name: "Updated Name",
        email: otherUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: 9 }],
      },
      await adminHeaders(),
    ).catch(() => undefined)

    const userRows = await db.select().from(user).where(eq(user.id, targetUser.id))
    expect(userRows).toHaveLength(1)
    expect(userRows[0].name).toBe(targetUser.name)
    expect(userRows[0].email).toBe(targetUser.email)
    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, targetUser.id))
    expect(configLimitRows).toHaveLength(1)
    expect(configLimitRows[0].maxCount).toBe(2)
  })

  it("responds with HTTP 409 when the email is taken", async () => {
    const targetUser = await insertTestUser()
    const otherUser = await insertTestUser()
    const headers = await adminHeaders()
    headers.set("content-type", "application/json")

    const response = await app.request(`/api/users/${targetUser.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ name: "Updated Name", email: otherUser.email }),
    })

    expect(response.status).toBe(409)
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    await expect(
      callUpdateUser(
        { id: `unknown-user-${randomUUID()}`, name: "Updated Name", email: uniqueEmail() },
        await adminHeaders(),
      ),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "NOT_FOUND")
  })

  it("rejects a malformed identifier with NOT_FOUND", async () => {
    await expect(
      callUpdateUser(
        { id: "%%%not-a-user-id%%%", name: "Updated Name", email: uniqueEmail() },
        await adminHeaders(),
      ),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "NOT_FOUND")
  })

  it("rejects an empty name", async () => {
    const targetUser = await insertTestUser()
    await expectBadRequest(
      { id: targetUser.id, name: "", email: targetUser.email },
      await adminHeaders(),
    )
  })

  it("rejects a name longer than 255 characters", async () => {
    const targetUser = await insertTestUser()
    await expectBadRequest(
      { id: targetUser.id, name: "a".repeat(256), email: targetUser.email },
      await adminHeaders(),
    )
  })

  it("accepts a name of exactly 255 characters", async () => {
    const targetUser = await insertTestUser()
    const name = "a".repeat(255)
    const updatedUser = await callUpdateUser(
      { id: targetUser.id, name, email: targetUser.email },
      await adminHeaders(),
    )

    expect(updatedUser.name).toBe(name)
  })

  it("rejects a missing name", async () => {
    const targetUser = await insertTestUser()
    await expectBadRequest({ id: targetUser.id, email: targetUser.email }, await adminHeaders())
  })

  it("rejects a malformed email", async () => {
    const targetUser = await insertTestUser()
    await expectBadRequest(
      { id: targetUser.id, name: targetUser.name, email: "not-an-email" },
      await adminHeaders(),
    )
  })

  it("rejects an email longer than 255 characters", async () => {
    const targetUser = await insertTestUser()
    await expectBadRequest(
      { id: targetUser.id, name: targetUser.name, email: `${"a".repeat(250)}@test.local` },
      await adminHeaders(),
    )
  })

  it("rejects limits containing a duplicate protocol family", async () => {
    const targetUser = await insertTestUser()
    await expectBadRequest(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [
          { protocolFamily: "amneziawg", maxCount: 1 },
          { protocolFamily: "amneziawg", maxCount: 2 },
        ],
      },
      await adminHeaders(),
    )
  })

  it("rejects a limit with a negative maxCount", async () => {
    const targetUser = await insertTestUser()
    await expectBadRequest(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: -1 }],
      },
      await adminHeaders(),
    )
  })

  it("rejects a limit with a non-integer maxCount", async () => {
    const targetUser = await insertTestUser()
    await expectBadRequest(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [{ protocolFamily: "amneziawg", maxCount: 1.5 }],
      },
      await adminHeaders(),
    )
  })

  it("rejects a limit with an unknown protocol family", async () => {
    const targetUser = await insertTestUser()
    await expectBadRequest(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        limits: [{ protocolFamily: "wireguard", maxCount: 1 }],
      },
      await adminHeaders(),
    )
  })

  it("leaves the database unchanged when input validation fails", async () => {
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 2 })

    await expectBadRequest(
      {
        id: targetUser.id,
        name: "",
        email: uniqueEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 9 }],
      },
      await adminHeaders(),
    )

    const userRows = await db.select().from(user).where(eq(user.id, targetUser.id))
    expect(userRows).toHaveLength(1)
    expect(userRows[0].name).toBe(targetUser.name)
    expect(userRows[0].email).toBe(targetUser.email)
    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, targetUser.id))
    expect(configLimitRows).toHaveLength(1)
    expect(configLimitRows[0].maxCount).toBe(2)
  })

  it("rejects an ordinary user updating another user's record with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const targetUser = await insertTestUser()

    await expect(
      callUpdateUser({ id: targetUser.id, name: "Updated Name", email: targetUser.email }, headers),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "FORBIDDEN")
  })

  it("rejects an ordinary user updating their own record with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(
      callUpdateUser(
        { id: requestUser.id, name: "Updated Name", email: requestUser.email },
        headers,
      ),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "FORBIDDEN")
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    const targetUser = await insertTestUser()

    await expect(
      callUpdateUser(
        { id: targetUser.id, name: "Updated Name", email: targetUser.email },
        new Headers(),
      ),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "UNAUTHORIZED")
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the user update throws", async () => {
      const targetUser = await insertTestUser()
      vi.mocked(updateUser).mockRejectedValueOnce(new Error("Update failure"))
      const headers = await adminHeaders()
      headers.set("content-type", "application/json")

      const response = await app.request(`/api/users/${targetUser.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name: "Updated Name", email: targetUser.email }),
      })
      expect(response.status).toBe(500)
    })
  })
})
