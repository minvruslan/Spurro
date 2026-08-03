import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { ConfigSchema, type UpdateConfig } from "@spurro/api-contract"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { configRouter } from "@/api/modules/config/index.js"
import { updateUserConfig as updateUserConfigQuery } from "@/api/modules/config/queries/updateUserConfig.js"
import { getEndpointProtocolClientService } from "@/api/modules/config/services/getEndpointProtocolClientService.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { config, deviceType, endpoint, protocol, server } from "@/core/database/schemas/index.js"
import {
  insertTestConfig,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestUser,
  signInTestUser,
} from "../../../helpers/index.js"

vi.mock("@/api/modules/config/services/getEndpointProtocolClientService.js", () => ({
  getEndpointProtocolClientService: vi.fn(),
}))

vi.mock("@/api/modules/config/queries/updateUserConfig.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/config/queries/updateUserConfig.js")>()
  return { updateUserConfig: vi.fn(original.updateUserConfig) }
})

const updateUserConfig = (input: unknown, headers: Headers) =>
  call(configRouter.updateUserConfig, input as UpdateConfig & { id: string }, {
    context: { headers },
  })

const expectUpdateUserConfigError = async (input: unknown, headers: Headers, errorCode: string) => {
  await expect(updateUserConfig(input, headers)).rejects.toSatisfy(
    (error) => error instanceof ORPCError && error.code === errorCode,
  )
}

async function insertConfigInfrastructure() {
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
    await db.delete(config)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
    await db.delete(deviceType)
    await bootstrapDeviceTypes()
  })

  it("updates the name and device type and returns the config matching the contract schema", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    const updatedConfig = await updateUserConfig(
      { id: insertedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(updatedConfig)
    expect(parsed.id).toBe(insertedConfig.id)
    expect(parsed.name).toBe("Updated Config")
    expect(parsed.deviceType.id).toBe(secondDeviceType.id)
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
      data: {
        protocolCode: "amneziawg2",
        ip: "10.8.0.2",
        publicKey: "test-public-key",
        presharedKey: "test-preshared-key",
      },
    })

    const updatedConfig = await updateUserConfig(
      { id: insertedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    ConfigSchema.parse(updatedConfig)
    expect(Object.keys(updatedConfig).sort()).toEqual([
      "createdAt",
      "data",
      "deviceType",
      "endpoint",
      "id",
      "name",
      "status",
      "updatedAt",
    ])
    expect(Object.keys(updatedConfig.deviceType).sort()).toEqual(["code", "id", "name"])
    expect(Object.keys(updatedConfig.endpoint).sort()).toEqual(["id", "port", "protocol", "server"])
    expect(Object.keys(updatedConfig.endpoint.protocol).sort()).toEqual([
      "code",
      "family",
      "id",
      "name",
    ])
    expect(Object.keys(updatedConfig.endpoint.server).sort()).toEqual(["country", "id", "name"])
    expect(Object.keys(updatedConfig.data).sort()).toEqual([
      "ip",
      "presharedKey",
      "protocolCode",
      "publicKey",
    ])
    expect(updatedConfig.data).not.toHaveProperty("configuration")
  })

  it("persists the new name and device type in the database", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await updateUserConfig(
      { id: insertedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    const configRows = await db.select().from(config).where(eq(config.id, insertedConfig.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].name).toBe("Updated Config")
    expect(configRows[0].deviceTypeId).toBe(secondDeviceType.id)
  })

  it("refreshes updatedAt on a successful update", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
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

    await updateUserConfig(
      { id: insertedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    const configRows = await db.select().from(config).where(eq(config.id, insertedConfig.id))
    expect(configRows[0].updatedAt.getTime()).toBeGreaterThan(pastUpdatedAt.getTime())
  })

  it("does not change status, endpoint, or data on update", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await updateUserConfig(
      { id: insertedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    const configRows = await db.select().from(config).where(eq(config.id, insertedConfig.id))
    expect(configRows[0].status).toBe("active")
    expect(configRows[0].endpointId).toBe(configEndpoint.id)
    expect(configRows[0].data).toEqual(insertedConfig.data)
  })

  it("does not touch the node on update", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await updateUserConfig(
      { id: insertedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    expect(vi.mocked(getEndpointProtocolClientService)).not.toHaveBeenCalled()
  })

  it("updates a pending config younger than the reservation window", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const pendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "pending",
    })

    const updatedConfig = await updateUserConfig(
      { id: pendingConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(updatedConfig)
    expect(parsed.id).toBe(pendingConfig.id)
    expect(parsed.name).toBe("Updated Config")
  })

  it("accepts a name of exactly 255 characters", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })
    const name = "a".repeat(255)

    const updatedConfig = await updateUserConfig(
      { id: insertedConfig.id, name, deviceTypeId: secondDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(updatedConfig)
    expect(parsed.name).toBe(name)
  })

  it("rejects a missing name with BAD_REQUEST", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await expectUpdateUserConfigError(
      { id: insertedConfig.id, deviceTypeId: secondDeviceType.id },
      headers,
      "BAD_REQUEST",
    )
  })

  it("rejects an empty name with BAD_REQUEST", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await expectUpdateUserConfigError(
      { id: insertedConfig.id, name: "", deviceTypeId: secondDeviceType.id },
      headers,
      "BAD_REQUEST",
    )
  })

  it("rejects a name longer than 255 characters with BAD_REQUEST", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await expectUpdateUserConfigError(
      { id: insertedConfig.id, name: "a".repeat(256), deviceTypeId: secondDeviceType.id },
      headers,
      "BAD_REQUEST",
    )
  })

  it("rejects a non-uuid deviceTypeId with BAD_REQUEST", async () => {
    const { configEndpoint, firstDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await expectUpdateUserConfigError(
      { id: insertedConfig.id, name: "Updated Config", deviceTypeId: "not-a-uuid" },
      headers,
      "BAD_REQUEST",
    )
  })

  it("rejects a non-uuid id with BAD_REQUEST", async () => {
    const { secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectUpdateUserConfigError(
      { id: "not-a-uuid", name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
      "BAD_REQUEST",
    )
  })

  it("rejects an unknown deviceTypeId with DEVICE_TYPE_INVALID", async () => {
    const { configEndpoint, firstDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await expectUpdateUserConfigError(
      { id: insertedConfig.id, name: "Updated Config", deviceTypeId: randomUUID() },
      headers,
      "DEVICE_TYPE_INVALID",
    )
  })

  it("rejects a disabled device type with DEVICE_TYPE_INVALID", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
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

    await expectUpdateUserConfigError(
      { id: insertedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
      "DEVICE_TYPE_INVALID",
    )
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    const { secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectUpdateUserConfigError(
      { id: randomUUID(), name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
      "NOT_FOUND",
    )
  })

  it("rejects another user's config with NOT_FOUND", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const otherUser = await insertTestUser()
    const otherUserConfig = await insertTestConfig({
      userId: otherUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    await expectUpdateUserConfigError(
      { id: otherUserConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
      "NOT_FOUND",
    )
  })

  it("rejects a pending config older than the reservation window with NOT_FOUND", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const stalePendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "pending",
    })
    await db
      .update(config)
      .set({ createdAt: new Date(Date.now() - 7 * 60 * 1000) })
      .where(eq(config.id, stalePendingConfig.id))

    await expectUpdateUserConfigError(
      { id: stalePendingConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
      "NOT_FOUND",
    )
  })

  it("rejects a deleting config with NOT_FOUND", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const deletingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "deleting",
    })

    await expectUpdateUserConfigError(
      { id: deletingConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
      "NOT_FOUND",
    )
  })

  it("rejects a deleted config with NOT_FOUND", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const deletedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "deleted",
    })

    await expectUpdateUserConfigError(
      { id: deletedConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
      "NOT_FOUND",
    )
  })

  it("allows an admin user as well", async () => {
    const { configEndpoint, firstDeviceType, secondDeviceType } = await insertConfigInfrastructure()
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await signInTestUser(adminUser)
    const adminConfig = await insertTestConfig({
      userId: adminUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: firstDeviceType.id,
      status: "active",
    })

    const updatedConfig = await updateUserConfig(
      { id: adminConfig.id, name: "Updated Config", deviceTypeId: secondDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(updatedConfig)
    expect(parsed.name).toBe("Updated Config")
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    const { secondDeviceType } = await insertConfigInfrastructure()

    await expectUpdateUserConfigError(
      { id: randomUUID(), name: "Updated Config", deviceTypeId: secondDeviceType.id },
      new Headers(),
      "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the config update query throws", async () => {
      vi.mocked(updateUserConfigQuery).mockRejectedValueOnce(new Error("Update failure"))

      const { configEndpoint, firstDeviceType, secondDeviceType } =
        await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
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
