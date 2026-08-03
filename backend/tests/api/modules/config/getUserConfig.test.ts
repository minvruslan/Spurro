import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { ConfigSchema } from "@spurro/api-contract"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { configRouter } from "@/api/modules/config/index.js"
import { findUserConfig } from "@/api/modules/config/queries/findUserConfig.js"
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

vi.mock("@/api/modules/config/queries/findUserConfig.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/config/queries/findUserConfig.js")>()
  return { findUserConfig: vi.fn(original.findUserConfig) }
})

const getUserConfig = (headers: Headers, id: string) =>
  call(configRouter.getUserConfig, { id }, { context: { headers } })

async function insertConfigInfrastructure(
  overrides: {
    protocol?: Partial<typeof protocol.$inferInsert>
    server?: Partial<typeof server.$inferInsert>
  } = {},
) {
  const configProtocol = await insertTestProtocol(overrides.protocol)
  const configServer = await insertTestServer(overrides.server)
  const configEndpoint = await insertTestEndpoint({
    serverId: configServer.id,
    protocolId: configProtocol.id,
  })
  const [configDeviceType] = await db.select().from(deviceType).limit(1)
  return { configEndpoint, configDeviceType }
}

describe("GET /configs/{id}", () => {
  beforeEach(async () => {
    await db.delete(config)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
    await db.delete(deviceType)
    await bootstrapDeviceTypes()
  })

  it("returns the requested config matching the contract schema", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })
    const requestedConfig = await getUserConfig(headers, insertedConfig.id)

    const parsed = ConfigSchema.parse(requestedConfig)
    expect(parsed.id).toBe(insertedConfig.id)
    expect(parsed.name).toBe(insertedConfig.name)
    expect(parsed.status).toBe("active")
    expect(parsed.deviceType.id).toBe(configDeviceType.id)
    expect(parsed.endpoint.id).toBe(configEndpoint.id)
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
      data: {
        protocolCode: "amneziawg2",
        ip: "10.8.0.2",
        publicKey: "test-public-key",
        presharedKey: "test-preshared-key",
      },
    })
    const requestedConfig = await getUserConfig(headers, insertedConfig.id)

    ConfigSchema.parse(requestedConfig)
    expect(Object.keys(requestedConfig).sort()).toEqual([
      "createdAt",
      "data",
      "deviceType",
      "endpoint",
      "id",
      "name",
      "status",
      "updatedAt",
    ])
    expect(Object.keys(requestedConfig.deviceType).sort()).toEqual(["code", "id", "name"])
    expect(Object.keys(requestedConfig.endpoint).sort()).toEqual([
      "id",
      "port",
      "protocol",
      "server",
    ])
    expect(Object.keys(requestedConfig.endpoint.protocol).sort()).toEqual([
      "code",
      "family",
      "id",
      "name",
    ])
    expect(Object.keys(requestedConfig.endpoint.server).sort()).toEqual(["country", "id", "name"])
    expect(Object.keys(requestedConfig.data).sort()).toEqual([
      "ip",
      "presharedKey",
      "protocolCode",
      "publicKey",
    ])
    expect(requestedConfig.data).not.toHaveProperty("configuration")
  })

  it("returns a pending config younger than the reservation window", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const pendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
    })
    const requestedConfig = await getUserConfig(headers, pendingConfig.id)

    const parsed = ConfigSchema.parse(requestedConfig)
    expect(parsed.id).toBe(pendingConfig.id)
    expect(parsed.status).toBe("pending")
  })

  it("returns a config whose protocol is disabled", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      protocol: { isEnabled: false },
    })
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const disabledProtocolConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })
    const requestedConfig = await getUserConfig(headers, disabledProtocolConfig.id)

    const parsed = ConfigSchema.parse(requestedConfig)
    expect(parsed.id).toBe(disabledProtocolConfig.id)
  })

  it("returns a config whose server has status deleted", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      server: { status: "deleted" },
    })
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const deletedServerConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })
    const requestedConfig = await getUserConfig(headers, deletedServerConfig.id)

    const parsed = ConfigSchema.parse(requestedConfig)
    expect(parsed.id).toBe(deletedServerConfig.id)
  })

  it("rejects a pending config older than the reservation window with NOT_FOUND", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const stalePendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
    })
    await db
      .update(config)
      .set({ createdAt: new Date(Date.now() - 7 * 60 * 1000) })
      .where(eq(config.id, stalePendingConfig.id))

    await expect(getUserConfig(headers, stalePendingConfig.id)).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    )
  })

  it("rejects a deleting config with NOT_FOUND", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const deletingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "deleting",
    })

    await expect(getUserConfig(headers, deletingConfig.id)).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    )
  })

  it("rejects a deleted config with NOT_FOUND", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const deletedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "deleted",
    })

    await expect(getUserConfig(headers, deletedConfig.id)).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    )
  })

  it("rejects another user's config with NOT_FOUND", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const otherUser = await insertTestUser()
    const otherUserConfig = await insertTestConfig({
      userId: otherUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    await expect(getUserConfig(headers, otherUserConfig.id)).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    )
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(getUserConfig(headers, randomUUID())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    )
  })

  it("rejects a non-uuid id with BAD_REQUEST", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(getUserConfig(headers, "not-a-uuid")).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "BAD_REQUEST",
    )
  })

  it("rejects an empty string id with BAD_REQUEST", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(getUserConfig(headers, "")).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "BAD_REQUEST",
    )
  })

  it("allows an admin user as well", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await signInTestUser(adminUser)
    const adminConfig = await insertTestConfig({
      userId: adminUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })
    const requestedConfig = await getUserConfig(headers, adminConfig.id)

    const parsed = ConfigSchema.parse(requestedConfig)
    expect(parsed.id).toBe(adminConfig.id)
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expect(getUserConfig(new Headers(), randomUUID())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the config query throws", async () => {
      vi.mocked(findUserConfig).mockRejectedValueOnce(new Error("Query failure"))

      const requestUser = await insertTestUser()
      const response = await app.request(`/api/configs/${randomUUID()}`, {
        headers: await signInTestUser(requestUser),
      })
      expect(response.status).toBe(500)
    })
  })
})
