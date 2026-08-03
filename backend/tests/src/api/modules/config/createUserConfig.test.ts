import { randomUUID } from "node:crypto"
import { call } from "@orpc/server"
import { ConfigSchema, type UpsertConfig } from "@spurro/api-contract"
import { RemoteServer } from "@spurro/infrastructure"
import { type EndpointData, type ServerData } from "@spurro/infrastructure/types"
import { eq, sql } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import app from "@/api/app.js"
import { configRouter } from "@/api/modules/config/index.js"
import { findEndpointProtocolClientData } from "@/api/modules/config/queries/findEndpointProtocolClientData.js"
import { insertUserConfig } from "@/api/modules/config/queries/insertUserConfig.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { config, deviceType, endpoint, protocol, server } from "@/core/database/schemas/index.js"
import { expectOrpcError } from "@tests/assertions/index.js"
import {
  createFakeProtocolClient,
  FakeProtocolClientData,
  FAKE_SERVER_SSH_HOST_KEY,
  insertTestConfig,
  insertTestConfigLimit,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestSession,
  insertTestUser,
} from "@tests/helpers/index.js"

vi.mock(
  "@/api/modules/config/queries/findEndpointProtocolClientData.js",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/api/modules/config/queries/findEndpointProtocolClientData.js")
      >()
    return { findEndpointProtocolClientData: vi.fn(original.findEndpointProtocolClientData) }
  },
)

vi.mock("@/api/modules/config/queries/insertUserConfig.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/config/queries/insertUserConfig.js")>()
  return { insertUserConfig: vi.fn(original.insertUserConfig) }
})

const allocatedClientIp = FakeProtocolClientData.clientIdentifier
const fakeClientConfiguration = FakeProtocolClientData.clientConfiguration
const fakePublicKey = FakeProtocolClientData.publicKey
const fakePresharedKey = FakeProtocolClientData.presharedKey
const appliedAt = "2026-01-01T00:00:00.000Z"
const serverSshHostKey = FAKE_SERVER_SSH_HOST_KEY

const fakeNodeConfigData = FakeProtocolClientData.configData

const validServerData: ServerData = {
  facts: { sshHostKeys: [serverSshHostKey] },
  actualState: {
    ssh: { type: "privateKey", username: "spurro", port: 22 },
    dns: "1.1.1.1",
    baseDirectory: "/opt/spurro",
    appliedAt,
  },
}

const validEndpointData: EndpointData = {
  actualState: { protocolCode: "amneziawg2", port: 51820, appliedAt },
}

const unsupportedProtocolClientData = {
  serverIp: "192.0.2.1",
  serverDomainName: null,
  protocolCode: "bogus",
  serverData: validServerData,
  endpointData: validEndpointData,
}

let fakeProtocolClient: ReturnType<typeof createFakeProtocolClient>
let getProtocolClientSpy: MockInstance<RemoteServer["getProtocolClient"]>

function callCreateUserConfig(input: unknown, headers: Headers) {
  return call(configRouter.createUserConfig, input as UpsertConfig, { context: { headers } })
}

function requestCreateUserConfig(input: Record<string, unknown>, headers: Headers) {
  headers.set("content-type", "application/json")
  return app.request("/api/configs", { method: "POST", headers, body: JSON.stringify(input) })
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
  return { configServer, configEndpoint, configDeviceType }
}

describe("POST /configs", () => {
  beforeEach(async () => {
    fakeProtocolClient = createFakeProtocolClient()
    getProtocolClientSpy = vi
      .spyOn(RemoteServer.prototype, "getProtocolClient")
      .mockReturnValue(fakeProtocolClient.client)
    await bootstrapDeviceTypes()
  })

  it("creates a config and returns it matching the contract schema", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const createdConfig = await callCreateUserConfig(
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
    const headers = await insertTestSession(requestUser)

    const createdConfig = await callCreateUserConfig(
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
    const headers = await insertTestSession(requestUser)
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
    const headers = await insertTestSession(requestUser)

    const createdConfig = await callCreateUserConfig(
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
    const headers = await insertTestSession(requestUser)

    const createdConfig = await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const configRows = await db.select().from(config).where(eq(config.id, createdConfig.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].status).toBe("active")
    expect(configRows[0].userId).toBe(requestUser.id)
    expect(configRows[0].clientIdentifier).toBe(allocatedClientIp)
    expect(configRows[0].data).toEqual(fakeNodeConfigData)
    expect(configRows[0].data.publicKey).toBe(fakePublicKey)
    expect(configRows[0].data.presharedKey).toBe(fakePresharedKey)
  })

  it("stores the data column encrypted at rest", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const createdConfig = await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const rawConfigRows = await db.execute<{ data: string }>(
      sql`select data::text as data from config where id = ${createdConfig.id}::uuid`,
    )
    expect(rawConfigRows).toHaveLength(1)
    expect(rawConfigRows[0]?.data.startsWith("v1:")).toBe(true)
    expect(rawConfigRows[0]?.data).not.toContain(fakePublicKey)
    expect(rawConfigRows[0]?.data).not.toContain(fakePresharedKey)
  })

  it("leaves another user's pending config untouched on a successful creation", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const otherUser = await insertTestUser()
    const otherUserPendingConfig = await insertTestConfig({
      userId: otherUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
      data: { protocolCode: "amneziawg2", ip: "10.8.0.50" },
    })

    await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const configRows = await db
      .select()
      .from(config)
      .where(eq(config.id, otherUserPendingConfig.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].status).toBe("pending")
    expect(configRows[0].data).toEqual(otherUserPendingConfig.data)
  })

  it("adds the peer to the node for the target endpoint", async () => {
    const targetServerIp = "198.51.100.7"
    const targetServerDomainName = "target-endpoint.example.test"
    const targetEndpointPort = 51999
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      server: { ip: targetServerIp, domainName: targetServerDomainName },
      endpoint: {
        data: { actualState: { protocolCode: "amneziawg2", port: targetEndpointPort, appliedAt } },
      },
    })
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    expect(getProtocolClientSpy).toHaveBeenCalledWith("amneziawg2")
    expect(fakeProtocolClient.createAccess).toHaveBeenCalledWith(
      expect.objectContaining({ ip: targetServerIp, domainName: targetServerDomainName }),
      expect.objectContaining({ port: targetEndpointPort }),
      allocatedClientIp,
    )
  })

  it("reserves the client identifiers of the existing configs on the same server", async () => {
    const { configServer, configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const otherEndpoint = await insertTestEndpoint({
      serverId: configServer.id,
      protocolId: configEndpoint.protocolId,
      port: configEndpoint.port + 1,
      status: "deleted",
    })
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const existingClientIdentifier = "10.8.0.77"
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: otherEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
      clientIdentifier: existingClientIdentifier,
    })

    await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    expect(fakeProtocolClient.allocateClientIdentifier.mock.calls).toHaveLength(1)
    expect(fakeProtocolClient.allocateClientIdentifier.mock.calls[0][1]).toContain(
      existingClientIdentifier,
    )
  })

  it("creates a config on an endpoint whose protocol is disabled", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      protocol: { isEnabled: false },
    })
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const createdConfig = await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.endpoint.id).toBe(configEndpoint.id)
  })

  it("accepts a name of exactly 255 characters", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const name = "a".repeat(255)

    const createdConfig = await callCreateUserConfig(
      { name, endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.name).toBe(name)
  })

  it("ignores unexpected extra fields in the body", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const createdConfig = await callCreateUserConfig(
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
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callCreateUserConfig(
        { endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
        headers,
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects an empty name with BAD_REQUEST", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callCreateUserConfig(
        { name: "", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
        headers,
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects a name longer than 255 characters with BAD_REQUEST", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callCreateUserConfig(
        { name: "a".repeat(256), endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
        headers,
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects a non-uuid endpointId with BAD_REQUEST", async () => {
    const { configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callCreateUserConfig(
        { name: "Created Config", endpointId: "not-a-uuid", deviceTypeId: configDeviceType.id },
        headers,
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects a non-uuid deviceTypeId with BAD_REQUEST", async () => {
    const { configEndpoint } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callCreateUserConfig(
        { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: "not-a-uuid" },
        headers,
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects an unknown endpointId with ENDPOINT_INVALID", async () => {
    const { configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callCreateUserConfig(
        { name: "Created Config", endpointId: randomUUID(), deviceTypeId: configDeviceType.id },
        headers,
      ),
      "ENDPOINT_INVALID",
    )
  })

  it("rejects an endpoint with status deleted with ENDPOINT_INVALID", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      endpoint: { status: "deleted" },
    })
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ),
      "ENDPOINT_INVALID",
    )
  })

  it("rejects an endpoint whose server is not active with ENDPOINT_INVALID", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      server: { status: "provisioning" },
    })
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ),
      "ENDPOINT_INVALID",
    )
  })

  it("rejects an unknown deviceTypeId with DEVICE_TYPE_INVALID", async () => {
    const { configEndpoint } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callCreateUserConfig(
        { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: randomUUID() },
        headers,
      ),
      "DEVICE_TYPE_INVALID",
    )
  })

  it("rejects a disabled device type with DEVICE_TYPE_INVALID", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await db
      .update(deviceType)
      .set({ isEnabled: false })
      .where(eq(deviceType.id, configDeviceType.id))

    await expectOrpcError(
      callCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ),
      "DEVICE_TYPE_INVALID",
    )
  })

  it("rejects the creation with NO_AVAILABLE_IP when the endpoint has no free client IP", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    fakeProtocolClient.allocateClientIdentifier.mockReturnValueOnce(null)

    await expectOrpcError(
      callCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ),
      "NO_AVAILABLE_IP",
    )
  })

  describe("limit gating", () => {
    it("rejects the creation with LIMIT_REACHED when slot-reserving configs equal maxCount", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
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

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "LIMIT_REACHED",
      )
    })

    it("creates a config when slot-reserving configs are one below maxCount", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 2 })
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })

      const createdConfig = await callCreateUserConfig(
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
      const headers = await insertTestSession(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 0 })

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "LIMIT_REACHED",
      )
    })

    it("creates a config when the user has no config limit row for the protocol family", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
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

      const createdConfig = await callCreateUserConfig(
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
      const headers = await insertTestSession(requestUser)
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

      const createdConfig = await callCreateUserConfig(
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
      const headers = await insertTestSession(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "deleting",
      })

      const createdConfig = await callCreateUserConfig(
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
      const headers = await insertTestSession(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "deleted",
      })

      const createdConfig = await callCreateUserConfig(
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
      const headers = await insertTestSession(requestUser)
      const otherUser = await insertTestUser()
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
      await insertTestConfig({
        userId: otherUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })

      const createdConfig = await callCreateUserConfig(
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
      const headers = await insertTestSession(requestUser)
      const otherUser = await insertTestUser()
      await insertTestConfigLimit({ userId: otherUser.id, maxCount: 0 })

      const createdConfig = await callCreateUserConfig(
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
      const headers = await insertTestSession(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
      const existingConfig = await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })

      await callCreateUserConfig(
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
      const headers = await insertTestSession(requestUser)
      fakeProtocolClient.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "FAILED",
      )
    })

    it("marks the config row deleted when the node-side creation fails", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      fakeProtocolClient.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))

      await callCreateUserConfig(
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
      const headers = await insertTestSession(requestUser)
      fakeProtocolClient.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))

      await callCreateUserConfig(
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

    it("leaves the user's other pending config untouched when the node-side creation fails", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      const otherPendingConfig = await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "pending",
        data: { protocolCode: "amneziawg2", ip: "10.8.0.50" },
      })
      fakeProtocolClient.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))

      await callCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ).catch(() => undefined)

      const configRows = await db.select().from(config).where(eq(config.id, otherPendingConfig.id))
      expect(configRows).toHaveLength(1)
      expect(configRows[0].status).toBe("pending")
    })

    it("keeps the config pending when both the node-side creation and the rollback delete fail", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      fakeProtocolClient.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))
      fakeProtocolClient.deleteAccessByClientIdentifier.mockRejectedValueOnce(
        new Error("Rollback failure"),
      )

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "FAILED",
      )

      const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
      expect(configRows).toHaveLength(1)
      expect(configRows[0].status).toBe("pending")
    })
  })

  describe("endpoint resolution failure", () => {
    const serverDataWithoutSshHostKeys: ServerData = {
      ...validServerData,
      facts: { sshHostKeys: [] },
    }

    const serverDataWithoutDns: ServerData = {
      facts: { sshHostKeys: [serverSshHostKey] },
      actualState: {
        ssh: { type: "privateKey", username: "spurro", port: 22 },
        baseDirectory: "/opt/spurro",
        appliedAt,
      },
    }

    const unparsableEndpointData = "not-endpoint-data" as unknown as EndpointData

    it("returns FAILED when the endpoint's server has no data", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
        server: { data: null },
      })
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "FAILED",
      )
    })

    it("returns FAILED when the server facts contain no ssh host keys", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
        server: { data: serverDataWithoutSshHostKeys },
      })
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "FAILED",
      )
    })

    it("returns FAILED when the server actual state has no dns", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
        server: { data: serverDataWithoutDns },
      })
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "FAILED",
      )
    })

    it("returns FAILED when the endpoint data has no valid actual state", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
        endpoint: { data: {} },
      })
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "FAILED",
      )
    })

    it("returns FAILED when the endpoint data does not parse as valid endpoint data", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
        endpoint: { data: unparsableEndpointData },
      })
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "FAILED",
      )
    })

    it("does not persist a config when the endpoint resolution fails", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
        server: { data: null },
      })
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      await callCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      ).catch(() => undefined)

      const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
      expect(configRows).toHaveLength(0)
    })
  })

  describe("cancellation race", () => {
    function cancelUserConfigsDuringCreateAccess(userId: string) {
      fakeProtocolClient.createAccess.mockImplementationOnce(async () => {
        await db.update(config).set({ status: "deleting" }).where(eq(config.userId, userId))
        return {
          configData: { ...fakeNodeConfigData },
          clientConfiguration: fakeClientConfiguration,
        }
      })
    }

    it("returns FAILED when the config is cancelled while node-side creation is in flight", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      cancelUserConfigsDuringCreateAccess(requestUser.id)

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "FAILED",
      )
    })

    it("does not resurrect a config cancelled during node-side creation", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      cancelUserConfigsDuringCreateAccess(requestUser.id)

      await callCreateUserConfig(
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
      const headers = await insertTestSession(requestUser)
      cancelUserConfigsDuringCreateAccess(requestUser.id)

      await callCreateUserConfig(
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

  describe("http error statuses", () => {
    it("responds with HTTP 502 when the node-side creation fails", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      fakeProtocolClient.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))

      const response = await requestCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      expect(response.status).toBe(502)
    })

    it("responds with HTTP 503 when the endpoint has no free client IP", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      fakeProtocolClient.allocateClientIdentifier.mockReturnValueOnce(null)

      const response = await requestCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      expect(response.status).toBe(503)
    })

    it("responds with HTTP 409 when the config limit is reached", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      await insertTestConfigLimit({ userId: requestUser.id, maxCount: 0 })

      const response = await requestCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      expect(response.status).toBe(409)
    })

    it("responds with HTTP 400 when the endpointId is unknown", async () => {
      const { configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      const response = await requestCreateUserConfig(
        { name: "Created Config", endpointId: randomUUID(), deviceTypeId: configDeviceType.id },
        headers,
      )

      expect(response.status).toBe(400)
    })

    it("responds with HTTP 400 when the deviceTypeId is unknown", async () => {
      const { configEndpoint } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      const response = await requestCreateUserConfig(
        { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: randomUUID() },
        headers,
      )

      expect(response.status).toBe(400)
    })
  })

  it("allows an admin user as well", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await insertTestSession(adminUser)

    const createdConfig = await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.name).toBe("Created Config")
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()

    await expectOrpcError(
      callCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        new Headers(),
      ),
      "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the config insert query throws", async () => {
      vi.mocked(insertUserConfig).mockRejectedValueOnce(new Error("Insert failure"))

      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
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

    it("returns FAILED when the endpoint is deleted between validation and protocol client resolution", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      vi.mocked(findEndpointProtocolClientData).mockResolvedValueOnce(undefined)

      await expectOrpcError(
        callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ),
        "FAILED",
      )
    })

    describe("unsupported protocol", () => {
      it("rejects the creation with UNSUPPORTED_PROTOCOL when the endpoint protocol client resolution reports unsupported_protocol", async () => {
        const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
        const requestUser = await insertTestUser()
        const headers = await insertTestSession(requestUser)
        vi.mocked(findEndpointProtocolClientData).mockResolvedValueOnce(
          unsupportedProtocolClientData,
        )

        await expectOrpcError(
          callCreateUserConfig(
            {
              name: "Created Config",
              endpointId: configEndpoint.id,
              deviceTypeId: configDeviceType.id,
            },
            headers,
          ),
          "UNSUPPORTED_PROTOCOL",
        )
      })

      it("does not persist a config when the endpoint protocol is unsupported", async () => {
        const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
        const requestUser = await insertTestUser()
        const headers = await insertTestSession(requestUser)
        vi.mocked(findEndpointProtocolClientData).mockResolvedValueOnce(
          unsupportedProtocolClientData,
        )

        await callCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        ).catch(() => undefined)

        const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
        expect(configRows).toHaveLength(0)
      })

      it("responds with HTTP 400 when the endpoint protocol is unsupported", async () => {
        const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
        const requestUser = await insertTestUser()
        const headers = await insertTestSession(requestUser)
        vi.mocked(findEndpointProtocolClientData).mockResolvedValueOnce(
          unsupportedProtocolClientData,
        )

        const response = await requestCreateUserConfig(
          {
            name: "Created Config",
            endpointId: configEndpoint.id,
            deviceTypeId: configDeviceType.id,
          },
          headers,
        )

        expect(response.status).toBe(400)
      })
    })
  })
})
