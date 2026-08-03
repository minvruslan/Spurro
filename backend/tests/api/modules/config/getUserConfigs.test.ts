import { call } from "@orpc/server"
import { ConfigSchema } from "@spurro/api-contract"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { configRouter } from "@/api/modules/config/index.js"
import { findUserConfigs } from "@/api/modules/config/queries/findUserConfigs.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { config, deviceType, protocol, server } from "@/core/database/schemas/index.js"
import { expectOrpcError } from "../../../assertions/index.js"
import {
  insertTestConfig,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestSession,
  insertTestUser,
} from "../../../helpers/index.js"

vi.mock("@/api/modules/config/queries/findUserConfigs.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/config/queries/findUserConfigs.js")>()
  return { findUserConfigs: vi.fn(original.findUserConfigs) }
})

function callGetUserConfigs(headers: Headers) {
  return call(configRouter.getUserConfigs, undefined, { context: { headers } })
}

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

describe("GET /configs", () => {
  beforeEach(bootstrapDeviceTypes)

  it("returns the requesting user's configs matching the contract schema", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
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

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfig({
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
    const configs = await callGetUserConfigs(headers)

    z.array(ConfigSchema).parse(configs)
    expect(configs).toHaveLength(1)
    const [entry] = configs
    expect(Object.keys(entry).sort()).toEqual([
      "createdAt",
      "data",
      "deviceType",
      "endpoint",
      "id",
      "name",
      "status",
      "updatedAt",
    ])
    expect(Object.keys(entry.deviceType).sort()).toEqual(["code", "id", "name"])
    expect(Object.keys(entry.endpoint).sort()).toEqual(["id", "port", "protocol", "server"])
    expect(Object.keys(entry.endpoint.protocol).sort()).toEqual(["code", "family", "id", "name"])
    expect(Object.keys(entry.endpoint.server).sort()).toEqual(["country", "id", "name"])
    expect(Object.keys(entry.data).sort()).toEqual([
      "ip",
      "presharedKey",
      "protocolCode",
      "publicKey",
    ])
    expect(entry.data).not.toHaveProperty("configuration")
  })

  it("returns an empty array when the user has no configs", async () => {
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const configs = await callGetUserConfigs(headers)

    expect(configs).toEqual([])
  })

  it("lists active configs", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const activeConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })
    const configs = await callGetUserConfigs(headers)

    const parsed = z.array(ConfigSchema).parse(configs)
    expect(parsed.map((entry) => entry.id)).toEqual([activeConfig.id])
  })

  it("lists pending configs younger than the reservation window", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
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
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
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
      .set({ createdAt: new Date(Date.now() - 7 * 60 * 1000) })
      .where(eq(config.id, stalePendingConfig.id))
    const configs = await callGetUserConfigs(headers)

    expect(configs).toEqual([])
  })

  it("omits deleting configs", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
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

  it("omits deleted configs", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "deleted",
    })
    const configs = await callGetUserConfigs(headers)

    expect(configs).toEqual([])
  })

  it("omits another user's configs", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
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
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
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

  it("lists a config whose server has status deleted", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      server: { status: "deleted" },
    })
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const deletedServerConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })
    const configs = await callGetUserConfigs(headers)

    const parsed = z.array(ConfigSchema).parse(configs)
    expect(parsed.map((entry) => entry.id)).toEqual([deletedServerConfig.id])
  })

  it("returns configs ordered by creation date descending", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
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
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
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

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expectOrpcError(callGetUserConfigs(new Headers()), "UNAUTHORIZED")
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
