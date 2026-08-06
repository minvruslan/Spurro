import { randomUUID } from "node:crypto"
import { call } from "@orpc/server"
import { ConfigSchema, type UpdateConfig } from "@spurro/api-contract"
import { ProtocolCodeSchema } from "@spurro/infrastructure/types"
import { RemoteServer } from "@spurro/infrastructure"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import app from "@/api/app.js"
import { PENDING_CONFIG_RESERVATION_MINUTES } from "@/api/modules/config-limit/queries/constants/PENDING_CONFIG_RESERVATION_MINUTES.js"
import { configRouter } from "@/api/modules/config/index.js"
import { updateUserConfig as updateUserConfigQuery } from "@/api/modules/config/queries/updateUserConfig.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/bootstrapDeviceTypes.js"
import { db } from "@/core/database/index.js"
import { config, deviceType } from "@/core/database/schemas/index.js"
import { expectOrpcError } from "@tests/assertions/index.js"
import {
  createFakeAmneziawg2Client,
  insertTestConfig,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestSession,
  insertTestUser,
} from "@tests/helpers/index.js"

vi.mock("@/api/modules/config/queries/updateUserConfig.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/config/queries/updateUserConfig.js")>()
  return { updateUserConfig: vi.fn(original.updateUserConfig) }
})

let getProtocolClientSpy: MockInstance<RemoteServer["getProtocolClient"]>

function callUpdateUserConfig(input: unknown, headers: Headers) {
  return call(configRouter.updateUserConfig, input as UpdateConfig & { id: string }, {
    context: { headers },
  })
}

async function insertConfigPrerequisites() {
  const configProtocol = await insertTestProtocol()
  const configServer = await insertTestServer()
  const configEndpoint = await insertTestEndpoint({
    serverId: configServer.id,
    protocolId: configProtocol.id,
  })
  const [firstDeviceType, secondDeviceType] = await db.select().from(deviceType).limit(2)
  return { configEndpoint, firstDeviceType, secondDeviceType }
}

describe("PUT /configs/{id}", () => {
  beforeEach(async () => {
    const fakeAmneziawg2Client = createFakeAmneziawg2Client()
    getProtocolClientSpy = vi
      .spyOn(RemoteServer.prototype, "getProtocolClient")
      .mockReturnValue(fakeAmneziawg2Client.client)
    await bootstrapDeviceTypes()
  })

  it("updates the name and device type, refreshes updatedAt, keeps status, endpoint and data, and does not touch the node", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })
    const pastUpdatedAt = new Date(Date.now() - 60 * 60 * 1000)
    await db
      .update(config)
      .set({ updatedAt: pastUpdatedAt })
      .where(eq(config.id, insertedConfig.id))

    const updatedConfig = await callUpdateUserConfig(
      { id: insertedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(updatedConfig)
    expect(parsed.id).toBe(insertedConfig.id)
    expect(parsed.name).toBe("Updated Config")
    expect(parsed.deviceType.id).toBe(secondDeviceType.id)
    const configRows = await db.select().from(config).where(eq(config.id, insertedConfig.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].name).toBe("Updated Config")
    expect(configRows[0].deviceTypeId).toBe(secondDeviceType.id)
    expect(configRows[0].updatedAt.getTime()).toBeGreaterThan(pastUpdatedAt.getTime())
    expect(configRows[0].status).toBe("active")
    expect(configRows[0].endpointId).toBe(configEndpoint.id)
    expect(configRows[0].data).toEqual(insertedConfig.data)
    expect(getProtocolClientSpy).not.toHaveBeenCalled()
  })

  it("leaves the user's other config untouched on update", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const updatedConfigRow = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })
    const siblingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await callUpdateUserConfig(
      { id: updatedConfigRow.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    const configRows = await db.select().from(config).where(eq(config.id, siblingConfig.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].name).toBe(siblingConfig.name)
    expect(configRows[0].deviceTypeId).toBe(firstDeviceType.id)
    expect(configRows[0].updatedAt.getTime()).toBe(siblingConfig.updatedAt.getTime())
  })

  it("updates a pending config younger than the reservation window", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const pendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "pending",
    })

    const updatedConfig = await callUpdateUserConfig(
      { id: pendingConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(updatedConfig)
    expect(parsed.id).toBe(pendingConfig.id)
    expect(parsed.name).toBe("Updated Config")
  })

  it("accepts a name of exactly 255 characters", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })
    const name = "a".repeat(255)

    const updatedConfig = await callUpdateUserConfig(
      { id: insertedConfig.id, name, deviceTypeId: secondDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(updatedConfig)
    expect(parsed.name).toBe(name)
  })

  it("rejects an unknown deviceTypeId with DEVICE_TYPE_INVALID", async () => {
    const { configEndpoint, firstDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await expectOrpcError(
      callUpdateUserConfig(
        { id: insertedConfig.id, name: "Updated Config", deviceTypeId: randomUUID() },
        headers,
      ),
      "DEVICE_TYPE_INVALID",
    )

    const configRows = await db.select().from(config).where(eq(config.id, insertedConfig.id))
    expect(configRows[0].name).toBe(insertedConfig.name)
    expect(configRows[0].deviceTypeId).toBe(firstDeviceType.id)
    expect(configRows[0].updatedAt.getTime()).toBe(insertedConfig.updatedAt.getTime())
  })

  it("rejects a disabled device type with DEVICE_TYPE_INVALID", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })
    await db
      .update(deviceType)
      .set({ isEnabled: false })
      .where(eq(deviceType.id, secondDeviceType.id))

    await expectOrpcError(
      callUpdateUserConfig(
        { id: insertedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
        headers,
      ),
      "DEVICE_TYPE_INVALID",
    )

    const configRows = await db.select().from(config).where(eq(config.id, insertedConfig.id))
    expect(configRows[0].name).toBe(insertedConfig.name)
    expect(configRows[0].deviceTypeId).toBe(firstDeviceType.id)
    expect(configRows[0].updatedAt.getTime()).toBe(insertedConfig.updatedAt.getTime())
  })

  it("responds with HTTP 400 when the deviceTypeId is unknown", async () => {
    const { configEndpoint, firstDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })
    headers.set("content-type", "application/json")

    const response = await app.request(`/api/configs/${insertedConfig.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ name: "Updated Config", deviceTypeId: randomUUID() }),
    })

    expect(response.status).toBe(400)
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    const { secondDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callUpdateUserConfig(
        { id: randomUUID(), name: "Updated Config", deviceTypeId: secondDeviceType.id },
        headers,
      ),
      "NOT_FOUND",
    )
  })

  it("rejects another user's config with NOT_FOUND", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const otherUser = await insertTestUser()
    const otherUserConfig = await insertTestConfig({
      userId: otherUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await expectOrpcError(
      callUpdateUserConfig(
        { id: otherUserConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
        headers,
      ),
      "NOT_FOUND",
    )

    const configRows = await db.select().from(config).where(eq(config.id, otherUserConfig.id))
    expect(configRows[0].name).toBe(otherUserConfig.name)
    expect(configRows[0].deviceTypeId).toBe(firstDeviceType.id)
    expect(configRows[0].updatedAt.getTime()).toBe(otherUserConfig.updatedAt.getTime())
  })

  it("rejects a pending config older than the reservation window with NOT_FOUND", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const stalePendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "pending",
    })
    await db
      .update(config)
      .set({
        createdAt: new Date(Date.now() - (PENDING_CONFIG_RESERVATION_MINUTES + 1) * 60 * 1000),
      })
      .where(eq(config.id, stalePendingConfig.id))

    await expectOrpcError(
      callUpdateUserConfig(
        { id: stalePendingConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
        headers,
      ),
      "NOT_FOUND",
    )

    const configRows = await db.select().from(config).where(eq(config.id, stalePendingConfig.id))
    expect(configRows[0].name).toBe(stalePendingConfig.name)
    expect(configRows[0].deviceTypeId).toBe(firstDeviceType.id)
    expect(configRows[0].status).toBe("pending")
  })

  it("rejects a deleting config with NOT_FOUND", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const deletingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "deleting",
    })

    await expectOrpcError(
      callUpdateUserConfig(
        { id: deletingConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
        headers,
      ),
      "NOT_FOUND",
    )

    const configRows = await db.select().from(config).where(eq(config.id, deletingConfig.id))
    expect(configRows[0].name).toBe(deletingConfig.name)
    expect(configRows[0].deviceTypeId).toBe(firstDeviceType.id)
    expect(configRows[0].status).toBe("deleting")
    expect(configRows[0].updatedAt.getTime()).toBe(deletingConfig.updatedAt.getTime())
  })

  it("allows an admin user as well", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigPrerequisites()
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await insertTestSession(adminUser)
    const adminConfig = await insertTestConfig({
      userId: adminUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    const updatedConfig = await callUpdateUserConfig(
      { id: adminConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(updatedConfig)
    expect(parsed.name).toBe("Updated Config")
  })

  describe("amneziawg2", () => {
    it("returns the stored data fields", async () => {
      const { configEndpoint, firstDeviceType, secondDeviceType } =
        await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      const insertedConfig = await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: firstDeviceType.id,
        status: "active",
        data: {
          protocolCode: ProtocolCodeSchema.enum.amneziawg2,
          ip: "10.8.0.2",
          publicKey: "test-public-key",
          presharedKey: "test-preshared-key",
        },
      })

      const updatedConfig = await callUpdateUserConfig(
        { id: insertedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
        headers,
      )

      const parsed = ConfigSchema.parse(updatedConfig)
      expect(Object.keys(parsed.data).sort()).toEqual([
        "ip",
        "presharedKey",
        "protocolCode",
        "publicKey",
      ])
    })
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the config update query throws", async () => {
      vi.mocked(updateUserConfigQuery).mockRejectedValueOnce(new Error("Update failure"))

      const { configEndpoint, firstDeviceType, secondDeviceType } =
        await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      const insertedConfig = await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: firstDeviceType.id,
        status: "active",
      })
      headers.set("content-type", "application/json")

      const response = await app.request(`/api/configs/${insertedConfig.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name: "Updated Config", deviceTypeId: secondDeviceType.id }),
      })
      expect(response.status).toBe(500)
    })
  })
})
