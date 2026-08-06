import { randomUUID } from "node:crypto"
import { call } from "@orpc/server"
import { ConfigSchema, type UpsertConfig } from "@spurro/api-contract"
import { ProtocolCodeSchema, ProtocolRegistry } from "@spurro/infrastructure/types"
import { RemoteServer } from "@spurro/infrastructure"
import { type EndpointData, type ServerData } from "@spurro/infrastructure/types"
import { eq, sql } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import app from "@/api/app.js"
import { PENDING_CONFIG_RESERVATION_MINUTES } from "@/api/modules/config-limit/queries/constants/PENDING_CONFIG_RESERVATION_MINUTES.js"
import { configRouter } from "@/api/modules/config/index.js"
import { findEndpointProtocolClientData } from "@/api/modules/config/queries/findEndpointProtocolClientData.js"
import { insertUserConfig } from "@/api/modules/config/queries/insertUserConfig.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/bootstrapDeviceTypes.js"
import { db } from "@/core/database/index.js"
import { config, deviceType, endpoint, protocol, server } from "@/core/database/schemas/index.js"
import { expectOrpcError } from "@tests/assertions/index.js"
import {
  createFakeAmneziawg2Client,
  FakeAmneziawg2EndpointActualState,
  FakeAmneziawg2CreateAccessResult,
  FAKE_SERVER_SSH_HOST_KEY,
  insertTestConfig,
  insertTestConfigLimit,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestSession,
  insertTestUser,
  waitForDatabaseLockWaiter,
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

const fakeConfigData = FakeAmneziawg2CreateAccessResult.configData
const fakeClientConfiguration = FakeAmneziawg2CreateAccessResult.clientConfiguration

const validServerData: ServerData = {
  facts: { sshHostKeys: [FAKE_SERVER_SSH_HOST_KEY] },
  actualState: {
    ssh: { type: "privateKey", username: "spurro", port: 22 },
    baseDirectory: "/opt/spurro",
    appliedAt: "2026-01-01T00:00:00.000Z",
  },
}

const validEndpointData: EndpointData = {
  actualState: FakeAmneziawg2EndpointActualState,
}

const serverDataWithoutSshHostKeys: ServerData = {
  ...validServerData,
  facts: { sshHostKeys: [] },
}

const endpointActualStateWithoutHost = { ...FakeAmneziawg2EndpointActualState, host: undefined }

const endpointActualStateWithoutDns = { ...FakeAmneziawg2EndpointActualState, dns: undefined }

const unparsableEndpointData = "not-endpoint-data" as unknown as EndpointData

const unsupportedProtocolClientData = {
  serverIp: "192.0.2.1",
  protocolCode: "bogus",
  serverData: validServerData,
  endpointData: validEndpointData,
}

let fakeAmneziawg2Client: ReturnType<typeof createFakeAmneziawg2Client>
let getProtocolClientSpy: MockInstance<RemoteServer["getProtocolClient"]>

function callCreateUserConfig(input: unknown, headers: Headers) {
  return call(configRouter.createUserConfig, input as UpsertConfig, { context: { headers } })
}

function requestCreateUserConfig(input: Record<string, unknown>, headers: Headers) {
  headers.set("content-type", "application/json")
  return app.request("/api/configs", { method: "POST", headers, body: JSON.stringify(input) })
}

async function insertConfigPrerequisites(
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
  return { configProtocol, configServer, configEndpoint, configDeviceType }
}

describe("POST /configs", () => {
  beforeEach(async () => {
    fakeAmneziawg2Client = createFakeAmneziawg2Client()
    getProtocolClientSpy = vi
      .spyOn(RemoteServer.prototype, "getProtocolClient")
      .mockReturnValue(fakeAmneziawg2Client.client)
    await bootstrapDeviceTypes()
  })

  it("creates a config and returns it matching the contract schema", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const createdConfig = await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.name).toBe("Created Config")
    expect(parsed.deviceType.id).toBe(configDeviceType.id)
    expect(parsed.endpoint.id).toBe(configEndpoint.id)
    expect(parsed.data.ip).toBe(fakeConfigData.ip)
    expect(parsed.data.configuration).toBe(fakeClientConfiguration)
  })

  it("issues the config endpoint host from the applied actual state and not from the live server columns", async () => {
    const appliedHost = "vpn.example.com"
    const { configServer, configEndpoint, configDeviceType } = await insertConfigPrerequisites({
      server: {
        ip: "203.0.113.9",
        domainName: "live.example.com",
      },
      endpoint: {
        data: { actualState: { ...FakeAmneziawg2EndpointActualState, host: appliedHost } },
      },
    })
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    fakeAmneziawg2Client.createAccess.mockImplementation(
      async (endpointActualState, clientIdentifier) => ({
        configData: { ...fakeConfigData, ip: clientIdentifier },
        clientConfiguration: `Endpoint = ${endpointActualState.host}:${endpointActualState.port}`,
      }),
    )

    const createdConfig = await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )
    await db
      .update(server)
      .set({ domainName: "changed.example.com" })
      .where(eq(server.id, configServer.id))

    const recreatedConfig = await callCreateUserConfig(
      {
        name: "Recreated Config",
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
      },
      headers,
    )

    const expectedEndpointLine = `Endpoint = ${appliedHost}:${configEndpoint.port}`
    expect(ConfigSchema.parse(createdConfig).data.configuration).toBe(expectedEndpointLine)
    expect(ConfigSchema.parse(recreatedConfig).data.configuration).toBe(expectedEndpointLine)
  })

  it("returns the joined endpoint, server, protocol and device type values", async () => {
    const { configProtocol, configServer, configEndpoint, configDeviceType } =
      await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const createdConfig = await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.endpoint.port).toBe(configEndpoint.port)
    expect(parsed.endpoint.protocol.code).toBe(configProtocol.code)
    expect(parsed.endpoint.protocol.family).toBe(configProtocol.family)
    expect(parsed.endpoint.protocol.name).toBe(configProtocol.name)
    expect(parsed.endpoint.server.name).toBe(configServer.name)
    expect(parsed.endpoint.server.country).toBe(configServer.country)
    expect(parsed.deviceType.code).toBe(configDeviceType.code)
    expect(parsed.deviceType.name).toBe(configDeviceType.name)
  })

  it("responds with HTTP 201 on success", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const response = await requestCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    expect(response.status).toBe(201)
  })

  it("persists the created config as active in the database", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
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
    expect(configRows[0].clientIdentifier).toBe(fakeConfigData.ip)
    expect(configRows[0].data).toEqual(fakeConfigData)
  })

  it("leaves another user's pending config untouched on a successful creation", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const otherUser = await insertTestUser()
    const otherUserPendingConfig = await insertTestConfig({
      userId: otherUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
      data: { protocolCode: ProtocolCodeSchema.enum.amneziawg2, ip: "10.8.0.50" },
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

  describe("amneziawg2", () => {
    it.todo("reserves the client identifiers of configs on the server's other endpoints")

    it("adds the peer to the node for the target endpoint", async () => {
      const targetEndpointHost = "target-endpoint.example.test"
      const targetEndpointPort = 51999
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
        endpoint: {
          data: {
            actualState: {
              ...FakeAmneziawg2EndpointActualState,
              host: targetEndpointHost,
              port: targetEndpointPort,
            },
          },
        },
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
      )

      expect(getProtocolClientSpy).toHaveBeenCalledWith(ProtocolCodeSchema.enum.amneziawg2)
      expect(fakeAmneziawg2Client.createAccess).toHaveBeenCalledWith(
        expect.objectContaining({ host: targetEndpointHost, port: targetEndpointPort }),
        fakeConfigData.ip,
      )
    })

    it("returns exactly the amneziawg2 config data fields", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      const createdConfig = await callCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      expect(Object.keys(ConfigSchema.parse(createdConfig).data).sort()).toEqual([
        "configuration",
        "ip",
        "presharedKey",
        "protocolCode",
        "publicKey",
      ])
    })

    it("stores the data column encrypted at rest", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      const createdConfig = await callCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      const rawConfigRows = await db.execute<{ data: string }>(
        sql`select data::text as data from config where id = ${createdConfig.id}::uuid`,
      )
      expect(rawConfigRows).toHaveLength(1)
      expect(rawConfigRows[0]?.data.startsWith("v1:")).toBe(true)
      expect(rawConfigRows[0]?.data).not.toContain(fakeConfigData.publicKey)
      expect(rawConfigRows[0]?.data).not.toContain(fakeConfigData.presharedKey)
    })

    it("reuses the client identifier of a deleted config", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      const firstConfig = await callCreateUserConfig(
        { name: "First Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
        headers,
      )
      await call(configRouter.deleteUserConfig, { id: firstConfig.id }, { context: { headers } })

      const recreatedConfig = await callCreateUserConfig(
        {
          name: "Recreated Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      expect(ConfigSchema.parse(recreatedConfig).data.ip).toBe(fakeConfigData.ip)
    })

    it("does not reserve client identifiers of configs on another server", async () => {
      const { configProtocol, configEndpoint, configDeviceType } = await insertConfigPrerequisites()
      const otherServer = await insertTestServer()
      const otherEndpoint = await insertTestEndpoint({
        serverId: otherServer.id,
        protocolId: configProtocol.id,
      })
      const otherUser = await insertTestUser()
      await insertTestConfig({
        userId: otherUser.id,
        endpointId: otherEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
        clientIdentifier: fakeConfigData.ip,
      })
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      const createdConfig = await callCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )

      const parsed = ConfigSchema.parse(createdConfig)
      expect(parsed.data.ip).toBe(fakeConfigData.ip)
    })

    it("creates a second config on the same endpoint with a distinct client identifier", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      await callCreateUserConfig(
        { name: "First Device", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
        headers,
      )

      await callCreateUserConfig(
        { name: "Second Device", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
        headers,
      )

      const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
      expect(configRows).toHaveLength(2)
      expect(configRows.every((row) => row.status === "active")).toBe(true)
      const clientIdentifiers = configRows.map((row) => row.clientIdentifier)
      expect(new Set(clientIdentifiers).size).toBe(2)
      expect(
        clientIdentifiers.every((clientIdentifier) =>
          clientIdentifier?.startsWith(`${FakeAmneziawg2EndpointActualState.subnetPrefix}.`),
        ),
      ).toBe(true)
    })

    it("returns FAILED when the endpoint actual state has no dns", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
        endpoint: { data: { actualState: endpointActualStateWithoutDns } },
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
  })

  it("creates a config on an endpoint whose protocol is disabled", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
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

  it("rejects an unknown endpointId with ENDPOINT_INVALID", async () => {
    const { configDeviceType } = await insertConfigPrerequisites()
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

  it("rejects an endpoint whose server is not active with ENDPOINT_INVALID", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
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
    const { configEndpoint } = await insertConfigPrerequisites()
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    fakeAmneziawg2Client.allocateClientIdentifier.mockReturnValueOnce(null)

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

    const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
    expect(configRows).toHaveLength(0)
  })

  it("rejects the creation with LIMIT_REACHED when slot-reserving configs equal maxCount", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfigLimit({
      userId: requestUser.id,
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 2,
    })
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfigLimit({
      userId: requestUser.id,
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 2,
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

  it("rejects one of two parallel creations on different servers when maxCount is one", async () => {
    const configProtocol = await insertTestProtocol()
    const firstServer = await insertTestServer()
    const secondServer = await insertTestServer()
    const firstEndpoint = await insertTestEndpoint({
      serverId: firstServer.id,
      protocolId: configProtocol.id,
    })
    const secondEndpoint = await insertTestEndpoint({
      serverId: secondServer.id,
      protocolId: configProtocol.id,
    })
    const [configDeviceType] = await db.select().from(deviceType).limit(1)
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfigLimit({
      userId: requestUser.id,
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 1,
    })
    let releaseInsert!: () => void
    let markInsertReached!: () => void
    const insertReleased = new Promise<void>((resolve) => {
      releaseInsert = resolve
    })
    const insertReached = new Promise<void>((resolve) => {
      markInsertReached = resolve
    })
    const originalInsertUserConfig = vi.mocked(insertUserConfig).getMockImplementation()!
    vi.mocked(insertUserConfig).mockImplementationOnce(async (executor, values) => {
      markInsertReached()
      await insertReleased
      return originalInsertUserConfig(executor, values)
    })

    const firstCreateUserConfigResult = callCreateUserConfig(
      { name: "First Config", endpointId: firstEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )
    await insertReached
    const secondCreateUserConfigResult = callCreateUserConfig(
      {
        name: "Second Config",
        endpointId: secondEndpoint.id,
        deviceTypeId: configDeviceType.id,
      },
      headers,
    )
    await waitForDatabaseLockWaiter(secondCreateUserConfigResult)
    releaseInsert()

    const firstCreatedConfig = await firstCreateUserConfigResult
    await expectOrpcError(secondCreateUserConfigResult, "LIMIT_REACHED")

    const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].id).toBe(firstCreatedConfig.id)
  })

  it("waits for the server advisory lock and rejects with LIMIT_REACHED after a concurrent reservation commits", async () => {
    const { configServer, configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfigLimit({
      userId: requestUser.id,
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 1,
    })

    let releaseReservation!: () => void
    let markReservationHeld!: () => void
    const reservationReleased = new Promise<void>((resolve) => {
      releaseReservation = resolve
    })
    const reservationHeld = new Promise<void>((resolve) => {
      markReservationHeld = resolve
    })

    const reservationTransaction = db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${configServer.id}))`)
      await insertTestConfig(
        {
          userId: requestUser.id,
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
          status: "active",
        },
        tx,
      )
      markReservationHeld()
      await reservationReleased
    })

    await reservationHeld
    const createUserConfigResult = callCreateUserConfig(
      {
        name: "Created Config",
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
      },
      headers,
    )
    await waitForDatabaseLockWaiter(createUserConfigResult)
    releaseReservation()
    await reservationTransaction

    await expectOrpcError(createUserConfigResult, "LIMIT_REACHED")

    const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
    expect(configRows).toHaveLength(1)
  })

  it("creates a config when the user has no config limit row for the protocol family", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfigLimit({
      userId: requestUser.id,
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 1,
    })
    const stalePendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
    })
    await db
      .update(config)
      .set({
        createdAt: new Date(Date.now() - (PENDING_CONFIG_RESERVATION_MINUTES + 1) * 60 * 1000),
      })
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfigLimit({
      userId: requestUser.id,
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 1,
    })
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

  it("does not count another user's configs toward the limit", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const otherUser = await insertTestUser()
    await insertTestConfigLimit({
      userId: requestUser.id,
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 1,
    })
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const otherUser = await insertTestUser()
    await insertTestConfigLimit({
      userId: otherUser.id,
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 0,
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

  it("does not persist a config when the limit is reached", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfigLimit({
      userId: requestUser.id,
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 1,
    })
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
    expect(fakeAmneziawg2Client.createAccess).not.toHaveBeenCalled()
  })

  it("returns FAILED, removes the config row, removes the peer from the node and leaves the user's other pending config untouched when the node-side creation fails", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const otherPendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
      data: { protocolCode: ProtocolCodeSchema.enum.amneziawg2, ip: "10.8.0.50" },
    })
    fakeAmneziawg2Client.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))

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
    expect(configRows[0].id).toBe(otherPendingConfig.id)
    expect(configRows[0].status).toBe("pending")
    expect(fakeAmneziawg2Client.deleteAccessByClientIdentifier).toHaveBeenCalledWith(
      expect.anything(),
      fakeConfigData.ip,
    )
  })

  it("keeps the config pending when both the node-side creation and the rollback delete fail", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    fakeAmneziawg2Client.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))
    fakeAmneziawg2Client.deleteAccessByClientIdentifier.mockRejectedValueOnce(
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

  it("returns FAILED when the endpoint's server has no data", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
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

  it("returns FAILED when the endpoint actual state has no host", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
      endpoint: { data: { actualState: endpointActualStateWithoutHost } },
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
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

  it("returns FAILED, does not resurrect the config and rolls the peer back off the node when the config is cancelled during node-side creation", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    fakeAmneziawg2Client.createAccess.mockImplementationOnce(async () => {
      await db.update(config).set({ status: "deleting" }).where(eq(config.userId, requestUser.id))
      return {
        configData: { ...fakeConfigData },
        clientConfiguration: fakeClientConfiguration,
      }
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
      "FAILED",
    )

    const configRows = await db.select().from(config).where(eq(config.userId, requestUser.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].status).toBe("deleting")
    expect(fakeAmneziawg2Client.deleteAccessByClientIdentifier).toHaveBeenCalledWith(
      expect.anything(),
      fakeConfigData.ip,
    )
  })

  it("responds with HTTP 502 when the node-side creation fails", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    fakeAmneziawg2Client.createAccess.mockRejectedValueOnce(new Error("Node-side failure"))

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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    fakeAmneziawg2Client.allocateClientIdentifier.mockReturnValueOnce(null)

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
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfigLimit({
      userId: requestUser.id,
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 0,
    })

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
    const { configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const response = await requestCreateUserConfig(
      { name: "Created Config", endpointId: randomUUID(), deviceTypeId: configDeviceType.id },
      headers,
    )

    expect(response.status).toBe(400)
  })

  it("responds with HTTP 400 when the deviceTypeId is unknown", async () => {
    const { configEndpoint } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const response = await requestCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: randomUUID() },
      headers,
    )

    expect(response.status).toBe(400)
  })

  it("allows an admin user as well", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await insertTestSession(adminUser)

    const createdConfig = await callCreateUserConfig(
      { name: "Created Config", endpointId: configEndpoint.id, deviceTypeId: configDeviceType.id },
      headers,
    )

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.name).toBe("Created Config")
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the config insert query throws", async () => {
      vi.mocked(insertUserConfig).mockRejectedValueOnce(new Error("Insert failure"))

      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)

      const response = await requestCreateUserConfig(
        {
          name: "Created Config",
          endpointId: configEndpoint.id,
          deviceTypeId: configDeviceType.id,
        },
        headers,
      )
      expect(response.status).toBe(500)
    })

    it("returns FAILED when the endpoint is deleted between validation and protocol client resolution", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
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

    it("rejects the creation with UNSUPPORTED_PROTOCOL when the endpoint protocol client resolution reports unsupported_protocol", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      vi.mocked(findEndpointProtocolClientData).mockResolvedValueOnce(unsupportedProtocolClientData)

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
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      vi.mocked(findEndpointProtocolClientData).mockResolvedValueOnce(unsupportedProtocolClientData)

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
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      vi.mocked(findEndpointProtocolClientData).mockResolvedValueOnce(unsupportedProtocolClientData)

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
