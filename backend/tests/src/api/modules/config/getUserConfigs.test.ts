import { call } from "@orpc/server"
import { ConfigSchema } from "@spurro/api-contract"
import { ProtocolCodeSchema } from "@spurro/infrastructure/types"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { PENDING_CONFIG_RESERVATION_MINUTES } from "@/api/modules/config-limit/queries/constants/PENDING_CONFIG_RESERVATION_MINUTES.js"
import { configRouter } from "@/api/modules/config/index.js"
import { findUserConfigs } from "@/api/modules/config/queries/findUserConfigs.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/bootstrapDeviceTypes.js"
import { db } from "@/core/database/index.js"
import { config, deviceType, protocol, server } from "@/core/database/schemas/index.js"
import {
  insertTestConfig,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestSession,
  insertTestUser,
} from "@tests/helpers/index.js"

vi.mock("@/api/modules/config/queries/findUserConfigs.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/config/queries/findUserConfigs.js")>()
  return { findUserConfigs: vi.fn(original.findUserConfigs) }
})

function callGetUserConfigs(headers: Headers) {
  return call(configRouter.getUserConfigs, undefined, { context: { headers } })
}

async function insertConfigPrerequisites(
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
  return { configProtocol, configServer, configEndpoint, configDeviceType }
}

describe("GET /configs", () => {
  beforeEach(bootstrapDeviceTypes)

  it("returns the requesting user's configs matching the contract schema", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    const configs = await callGetUserConfigs(headers)

    const parsed = z.array(ConfigSchema).parse(configs)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe(insertedConfig.id)
    expect(parsed[0].name).toBe(insertedConfig.name)
    expect(parsed[0].status).toBe("active")
    expect(parsed[0].deviceType.id).toBe(configDeviceType.id)
    expect(parsed[0].endpoint.id).toBe(configEndpoint.id)
  })

  it("returns the joined endpoint, server, protocol and device type values", async () => {
    const { configProtocol, configServer, configEndpoint, configDeviceType } =
      await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    const configs = await callGetUserConfigs(headers)

    z.array(ConfigSchema).parse(configs)
    expect(configs).toHaveLength(1)
    const [entry] = configs
    expect(entry.endpoint.port).toBe(configEndpoint.port)
    expect(entry.endpoint.protocol.code).toBe(configProtocol.code)
    expect(entry.endpoint.protocol.family).toBe(configProtocol.family)
    expect(entry.endpoint.protocol.name).toBe(configProtocol.name)
    expect(entry.endpoint.server.name).toBe(configServer.name)
    expect(entry.endpoint.server.country).toBe(configServer.country)
    expect(entry.deviceType.code).toBe(configDeviceType.code)
    expect(entry.deviceType.name).toBe(configDeviceType.name)
  })

  it("returns each config with its own server", async () => {
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
    const firstConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: firstEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const secondConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: secondEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })

    const configs = await callGetUserConfigs(headers)

    const serverNamesByConfigId = new Map(
      configs.map((entry) => [entry.id, entry.endpoint.server.name]),
    )
    expect(serverNamesByConfigId.get(firstConfig.id)).toBe(firstServer.name)
    expect(serverNamesByConfigId.get(secondConfig.id)).toBe(secondServer.name)
  })

  it("returns an empty array when the user has no configs", async () => {
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const configs = await callGetUserConfigs(headers)

    expect(configs).toEqual([])
  })

  it("lists pending configs younger than the reservation window", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const pendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
    })

    const configs = await callGetUserConfigs(headers)

    const parsed = z.array(ConfigSchema).parse(configs)
    expect(parsed.map((entry) => entry.id)).toEqual([pendingConfig.id])
    expect(parsed[0].status).toBe("pending")
  })

  it("omits pending configs older than the reservation window", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
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

    const configs = await callGetUserConfigs(headers)

    expect(configs).toEqual([])
  })

  it("omits deleting configs", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "deleting",
    })

    const configs = await callGetUserConfigs(headers)

    expect(configs).toEqual([])
  })

  it("omits another user's configs", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const otherUser = await insertTestUser()
    const requestUserConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })
    await insertTestConfig({
      userId: otherUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    const configs = await callGetUserConfigs(headers)

    const parsed = z.array(ConfigSchema).parse(configs)
    expect(parsed.map((entry) => entry.id)).toEqual([requestUserConfig.id])
  })

  it("lists a config whose protocol is disabled", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites({
      protocol: { isEnabled: false },
    })
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const disabledProtocolConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    const configs = await callGetUserConfigs(headers)

    const parsed = z.array(ConfigSchema).parse(configs)
    expect(parsed.map((entry) => entry.id)).toEqual([disabledProtocolConfig.id])
  })

  it("returns configs ordered by creation date descending", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const oldestConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    })
    const newestConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    })
    const middleConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    })

    const configs = await callGetUserConfigs(headers)

    const parsed = z.array(ConfigSchema).parse(configs)
    expect(parsed.map((entry) => entry.id)).toEqual([
      newestConfig.id,
      middleConfig.id,
      oldestConfig.id,
    ])
  })

  it("allows an admin user as well", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await insertTestSession(adminUser)
    const adminConfig = await insertTestConfig({
      userId: adminUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    const configs = await callGetUserConfigs(headers)

    const parsed = z.array(ConfigSchema).parse(configs)
    expect(parsed.map((entry) => entry.id)).toEqual([adminConfig.id])
  })

  describe("amneziawg2", () => {
    it("returns the stored data fields", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigPrerequisites()
      const requestUser = await insertTestUser()
      const headers = await insertTestSession(requestUser)
      await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
        data: {
          protocolCode: ProtocolCodeSchema.enum.amneziawg2,
          ip: "10.8.0.2",
          publicKey: "test-public-key",
          presharedKey: "test-preshared-key",
        },
      })

      const configs = await callGetUserConfigs(headers)

      const parsed = z.array(ConfigSchema).parse(configs)
      expect(Object.keys(parsed[0].data).sort()).toEqual([
        "ip",
        "presharedKey",
        "protocolCode",
        "publicKey",
      ])
    })
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the config query throws", async () => {
      vi.mocked(findUserConfigs).mockRejectedValueOnce(new Error("Query failure"))

      const requestUser = await insertTestUser()

      const response = await app.request("/api/configs", {
        headers: await insertTestSession(requestUser),
      })
      expect(response.status).toBe(500)
    })
  })
})
