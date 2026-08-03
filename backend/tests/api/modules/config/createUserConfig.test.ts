import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { ConfigSchema, type UpsertConfig } from "@spurro/api-contract"
import type { ProtocolClient } from "@spurro/infrastructure"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { configRouter } from "@/api/modules/config/index.js"
import { insertUserConfig } from "@/api/modules/config/queries/insertUserConfig.js"
import { getEndpointProtocolClientService } from "@/api/modules/config/services/getEndpointProtocolClientService.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import {
  config,
  configLimit,
  deviceType,
  endpoint,
  protocol,
  server,
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

vi.mock("@/api/modules/config/services/getEndpointProtocolClientService.js", () => ({
  getEndpointProtocolClientService: vi.fn(),
}))

vi.mock("@/api/modules/config/queries/insertUserConfig.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/config/queries/insertUserConfig.js")>()
  return { insertUserConfig: vi.fn(original.insertUserConfig) }
})

const allocatedClientIp = "10.8.1.2"
const fakeClientConfiguration = "fake-client-configuration"

function createFakeProtocolClient() {
  return {
    allocateClientIdentifier: vi.fn().mockReturnValue(allocatedClientIp),
    createInitialConfigData: vi.fn().mockImplementation((clientIdentifier: string) => ({
      protocolCode: "amneziawg2" as const,
      ip: clientIdentifier,
    })),
    createAccess: vi.fn().mockResolvedValue({
      configData: {
        protocolCode: "amneziawg2" as const,
        ip: allocatedClientIp,
        publicKey: "fake-public-key",
        presharedKey: "fake-preshared-key",
      },
      clientConfiguration: fakeClientConfiguration,
    }),
    deleteAccessByClientIdentifier: vi.fn().mockResolvedValue(undefined),
  }
}

let fakeProtocolClient: ReturnType<typeof createFakeProtocolClient>

const createUserConfig = (input: unknown, headers: Headers) =>
  call(configRouter.createUserConfig, input as UpsertConfig, { context: { headers } })

const expectCreateUserConfigError = async (input: unknown, headers: Headers, errorCode: string) => {
  await expect(createUserConfig(input, headers)).rejects.toSatisfy(
    (error) => error instanceof ORPCError && error.code === errorCode,
  )
}

async function insertConfigInfrastructure(
  overrides: {
    protocol?: Partial<typeof protocol.$inferInsert>
    server?: Partial<typeof server.$inferInsert>
    endpoint?: Partial<typeof endpoint.$inferInsert>
  } = {},
) {
  const configProtocol = await insertTestProtocol(overrides.protocol)
  const configServer = await insertTestServer(overrides.server)
  const configEndpoint = await insertTestEndpoint({
    serverId: configServer.id,
    protocolId: configProtocol.id,
    ...overrides.endpoint,
  })
  const [configDeviceType] = await db.select().from(deviceType).limit(1)
  return { configEndpoint, configDeviceType }
}

describe("POST /configs", () => {
  beforeEach(async () => {
    fakeProtocolClient = createFakeProtocolClient()
    vi.mocked(getEndpointProtocolClientService).mockReset()
    vi.mocked(getEndpointProtocolClientService).mockImplementation(async () => ({
      ok: true,
      data: {
        client: fakeProtocolClient as unknown as ProtocolClient,
        server: {
          ip: "192.0.2.10",
          domainName: null,
          actualState: {
            ssh: { type: "privateKey", username: "spurro", port: 22 },
            dns: "1.1.1.1",
            appliedAt: new Date().toISOString(),
          },
        },
        endpointActualState: {
          protocolCode: "amneziawg2",
          port: 51820,
          appliedAt: new Date().toISOString(),
        },
        protocolCode: "amneziawg2",
      },
    }))
    await db.delete(config)
    await db.delete(configLimit)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
    await db.delete(deviceType)
    await bootstrapDeviceTypes()
  })

  it("creates a config and returns it matching the contract schema", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    const createdConfig = await createUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.endpoint.id).toBe(configEndpoint.id)
    expect(parsed.data.ip).toBe(allocatedClientIp)
    expect(parsed.data.configuration).toBe(fakeClientConfiguration)
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    const createdConfig = await createUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    ConfigSchema.parse(createdConfig)
    expect(Object.keys(createdConfig).sort()).toEqual([
      "createdAt",
      "data",
      "deviceType",
      "endpoint",
      "id",
      "name",
      "status",
      "updatedAt",
    ])
    expect(Object.keys(createdConfig.deviceType).sort()).toEqual(["code", "id", "name"])
    expect(Object.keys(createdConfig.endpoint).sort()).toEqual(["id", "port", "protocol", "server"])
    expect(Object.keys(createdConfig.endpoint.protocol).sort()).toEqual([
      "code",
      "family",
      "id",
      "name",
    ])
    expect(Object.keys(createdConfig.endpoint.server).sort()).toEqual(["country", "id", "name"])
    expect(Object.keys(createdConfig.data).sort()).toEqual([
      "configuration",
      "ip",
      "presharedKey",
      "protocolCode",
      "publicKey",
    ])
  })

  it("responds with HTTP 201 on success", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    headers.set("content-type", "application/json")

    const response = await app.request("/api/configs", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Created Config",
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
      }),
    })

    expect(response.status).toBe(201)
  })

  it("returns the created config with the requested name and device type", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    const createdConfig = await createUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.name).toBe("Created Config")
    expect(parsed.deviceType.id).toBe(configDeviceType.id)
  })

  it("persists the created config as active in the database", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    const createdConfig = await createUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const configRows = await db.select().from(config).where(eq(config.id, createdConfig.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].status).toBe("active")
    expect(configRows[0].userId).toBe(requestUser.id)
  })

  it("adds the peer to the node for the target endpoint", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await createUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    expect(vi.mocked(getEndpointProtocolClientService)).toHaveBeenCalledWith(configEndpoint.id)
    expect(fakeProtocolClient.createAccess).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      allocatedClientIp,
    )
  })

  it("creates a config on an endpoint whose protocol is disabled", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      protocol: { isEnabled: false },
    })
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    const createdConfig = await createUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.endpoint.id).toBe(configEndpoint.id)
  })

  it("accepts a name of exactly 255 characters", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const name = "a".repeat(255)

    const createdConfig = await createUserConfig(
      { name, endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.name).toBe(name)
  })

  it("ignores unexpected extra fields in the body", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    const createdConfig = await createUserConfig(
      {
        name: "Created Config",
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        unknownField: "ignored",
      },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.name).toBe("Created Config")
    expect(createdConfig).not.toHaveProperty("unknownField")
  })

  it("rejects a missing name with BAD_REQUEST", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectCreateUserConfigError(
      { endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
      "BAD_REQUEST",
    )
  })

  it("rejects an empty name with BAD_REQUEST", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectCreateUserConfigError(
      { name: "", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
      "BAD_REQUEST",
    )
  })

  it("rejects a name longer than 255 characters with BAD_REQUEST", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectCreateUserConfigError(
      { name: "a".repeat(256), endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
      "BAD_REQUEST",
    )
  })

  it("rejects a non-uuid endpointId with BAD_REQUEST", async () => {
    const { configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectCreateUserConfigError(
      { name: "Created Config", endpointId: "not-a-uuid", deviceTypeId: configDeviceType.id },
      headers,
      "BAD_REQUEST",
    )
  })

  it("rejects a non-uuid deviceTypeId with BAD_REQUEST", async () => {
    const { configEndpoint } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectCreateUserConfigError(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: "not-a-uuid" },
      headers,
      "BAD_REQUEST",
    )
  })

  it("rejects an unknown endpointId with ENDPOINT_INVALID", async () => {
    const { configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectCreateUserConfigError(
      { name: "Created Config", endpointId: randomUUID(), deviceTypeId: configDeviceType.id },
      headers,
      "ENDPOINT_INVALID",
    )
  })

  it("rejects an endpoint with status deleted with ENDPOINT_INVALID", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      endpoint: { status: "deleted" },
    })
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectCreateUserConfigError(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
      "ENDPOINT_INVALID",
    )
  })

  it("rejects an endpoint whose server is not active with ENDPOINT_INVALID", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      server: { status: "provisioning" },
    })
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectCreateUserConfigError(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
      "ENDPOINT_INVALID",
    )
  })

  it("rejects an unknown deviceTypeId with DEVICE_TYPE_INVALID", async () => {
    const { configEndpoint } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectCreateUserConfigError(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: randomUUID() },
      headers,
      "DEVICE_TYPE_INVALID",
    )
  })

  it("rejects a disabled device type with DEVICE_TYPE_INVALID", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await db
      .update(deviceType)
      .set({ isEnabled: false })
      .where(eq(deviceType.id, configDeviceType.id))

    await expectCreateUserConfigError(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
      "DEVICE_TYPE_INVALID",
    )
  })

  it("rejects the creation with NO_AVAILABLE_IP when the endpoint has no free client IP", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    fakeProtocolClient.allocateClientIdentifier.mockReturnValueOnce(null)

    await expectCreateUserConfigError(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
      "NO_AVAILABLE_IP",
    )
  })

  describe("limit gating", () => {
    it("rejects the creation with LIMIT_REACHED when slot-reserving configs equal maxCount", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 2 })
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "pending",
      })

      await expectCreateUserConfigError(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
        "LIMIT_REACHED",
      )
    })

    it("creates a config when slot-reserving configs are one below maxCount", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 2 })
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })

      const createdConfig = await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      const parsed = ConfigSchema.parse(createdConfig)
      expect(parsed.name).toBe("Created Config")
    })

    it("rejects the creation with LIMIT_REACHED when maxCount is zero", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 0 })

      await expectCreateUserConfigError(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
        "LIMIT_REACHED",
      )
    })

    it("creates a config when the user has no config limit row for the protocol family", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })

      const createdConfig = await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      const parsed = ConfigSchema.parse(createdConfig)
      expect(parsed.name).toBe("Created Config")
    })

    it("does not count a pending config older than the reservation window toward the limit", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
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

      const createdConfig = await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      const parsed = ConfigSchema.parse(createdConfig)
      expect(parsed.name).toBe("Created Config")
    })

    it("does not count a deleting config toward the limit", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "deleting",
      })

      const createdConfig = await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      const parsed = ConfigSchema.parse(createdConfig)
      expect(parsed.name).toBe("Created Config")
    })

    it("does not count deleted configs toward the limit", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "deleted",
      })

      const createdConfig = await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      const parsed = ConfigSchema.parse(createdConfig)
      expect(parsed.name).toBe("Created Config")
    })

    it("does not count another user's configs toward the limit", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      const otherUser = await insertTestUser()
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
      await insertTestConfig({
        userId: otherUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })

      const createdConfig = await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      const parsed = ConfigSchema.parse(createdConfig)
      expect(parsed.name).toBe("Created Config")
    })

    it("ignores another user's config limit row", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      const otherUser = await insertTestUser()
      await insertTestConfigLimit({ userId: otherUser.id, maxCount: 0 })

      const createdConfig = await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      const parsed = ConfigSchema.parse(createdConfig)
      expect(parsed.name).toBe("Created Config")
    })

    it("does not persist a config when the limit is reached", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
      const existingConfig = await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })

      await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ).catch(() => undefined)

      const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
      expect(configRows).toHaveLength(1)
      expect(configRows[0].id).toBe(existingConfig.id)
    })
  })

  describe("node-side creation failure", () => {
    it("returns FAILED when the node-side creation fails", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      fakeProtocolClient.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))

      await expectCreateUserConfigError(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
        "FAILED",
      )
    })

    it("marks the config row deleted when the node-side creation fails", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      fakeProtocolClient.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))

      await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ).catch(() => undefined)

      const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
      expect(configRows).toHaveLength(1)
      expect(configRows[0].status).toBe("deleted")
    })

    it("removes the peer from the node when the node-side creation fails", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      fakeProtocolClient.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))

      await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ).catch(() => undefined)

      expect(fakeProtocolClient.deleteAccessByClientIdentifier).toHaveBeenCalledWith(
        expect.anything(),
        allocatedClientIp,
      )
    })

    it("keeps the config pending when both the node-side creation and the rollback delete fail", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      fakeProtocolClient.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))
      fakeProtocolClient.deleteAccessByClientIdentifier.mockRejectedValueOnce(
        new Error("Rollback failure"),
      )

      await expectCreateUserConfigError(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
        "FAILED",
      )

      const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
      expect(configRows).toHaveLength(1)
      expect(configRows[0].status).toBe("pending")
    })

    it("returns FAILED when the endpoint protocol client cannot be resolved", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      vi.mocked(getEndpointProtocolClientService).mockResolvedValueOnce({
        ok: false,
        errorCode: "unavailable",
        error: new Error("Protocol client unavailable"),
      })

      await expectCreateUserConfigError(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
        "FAILED",
      )

      const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
      expect(configRows).toHaveLength(0)
    })
  })

  describe("cancellation race", () => {
    const cancelUserConfigsDuringCreateAccess = (userId: string) => {
      fakeProtocolClient.createAccess.mockImplementationOnce(async () => {
        await db.update(config).set({ status: "deleting" }).where(eq(config.userId, userId))
        return {
          configData: {
            protocolCode: "amneziawg2" as const,
            ip: allocatedClientIp,
            publicKey: "fake-public-key",
            presharedKey: "fake-preshared-key",
          },
          clientConfiguration: fakeClientConfiguration,
        }
      })
    }

    it("returns FAILED when the config is cancelled while node-side creation is in flight", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      cancelUserConfigsDuringCreateAccess(requestUser.id)

      await expectCreateUserConfigError(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
        "FAILED",
      )
    })

    it("does not resurrect a config cancelled during node-side creation", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      cancelUserConfigsDuringCreateAccess(requestUser.id)

      await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ).catch(() => undefined)

      const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
      expect(configRows).toHaveLength(1)
      expect(configRows[0].status).not.toBe("active")
    })

    it("rolls the peer back off the node when the config was cancelled during creation", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      cancelUserConfigsDuringCreateAccess(requestUser.id)

      await createUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ).catch(() => undefined)

      expect(fakeProtocolClient.deleteAccessByClientIdentifier).toHaveBeenCalledWith(
        expect.anything(),
        allocatedClientIp,
      )
    })
  })

  it("allows an admin user as well", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await signInTestUser(adminUser)

    const createdConfig = await createUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.name).toBe("Created Config")
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()

    await expectCreateUserConfigError(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      new Headers(),
      "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the config insert query throws", async () => {
      vi.mocked(insertUserConfig).mockRejectedValueOnce(new Error("Insert failure"))

      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      headers.set("content-type", "application/json")

      const response = await app.request("/api/configs", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        }),
      })
      expect(response.status).toBe(500)
    })
  })
})
