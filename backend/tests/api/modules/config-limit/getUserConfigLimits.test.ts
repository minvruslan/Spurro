import { call, ORPCError } from "@orpc/server"
import { ConfigLimitSchema } from "@spurro/api-contract"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { configLimitRouter } from "@/api/modules/config-limit/index.js"
import { findUserConfigLimits } from "@/api/modules/config-limit/queries/findUserConfigLimits.js"
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

vi.mock("@/api/modules/config-limit/queries/findUserConfigLimits.js", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/api/modules/config-limit/queries/findUserConfigLimits.js")
    >()
  return { findUserConfigLimits: vi.fn(original.findUserConfigLimits) }
})

const getUserConfigLimits = (headers: Headers) =>
  call(configLimitRouter.getUserConfigLimits, undefined, { context: { headers } })

async function insertConfigInfrastructure(
  protocolOverrides: Partial<typeof protocol.$inferInsert> = {},
) {
  const configProtocol = await insertTestProtocol(protocolOverrides)
  const configServer = await insertTestServer()
  const configEndpoint = await insertTestEndpoint({
    serverId: configServer.id,
    protocolId: configProtocol.id,
  })
  const [configDeviceType] = await db.select().from(deviceType).limit(1)
  return { configEndpoint, configDeviceType }
}

describe("GET /config-limits", () => {
  beforeEach(async () => {
    await db.delete(config)
    await db.delete(configLimit)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
    await db.delete(deviceType)
    await bootstrapDeviceTypes()
  })

  it("returns the requesting user's config limits matching the contract schema", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfigLimit = await insertTestConfigLimit({ userId: requestUser.id, maxCount: 3 })
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe(insertedConfigLimit.id)
    expect(parsed[0].protocolFamily).toBe("amneziawg")
    expect(parsed[0].maxCount).toBe(3)
  })

  it("exposes exactly the contract fields and nothing more", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id })
    const configLimits = await getUserConfigLimits(headers)

    expect(configLimits).toHaveLength(1)
    for (const entry of configLimits) {
      expect(Object.keys(entry).sort()).toEqual([
        "createdAt",
        "id",
        "maxCount",
        "protocolFamily",
        "updatedAt",
        "used",
      ])
    }
  })

  it("returns used as the number of the user's slot-reserving configs in the limit's protocol family", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id, maxCount: 5 })
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
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].used).toBe(2)
  })

  it("returns used as zero when the user has no configs", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id })
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].used).toBe(0)
  })

  it("counts pending configs younger than the reservation window toward used", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id })
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
    })
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].used).toBe(1)
  })

  it("excludes pending configs older than the reservation window from used", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id })
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
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].used).toBe(0)
  })

  it("excludes deleting configs from used", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id })
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "deleting",
    })
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].used).toBe(0)
  })

  it("excludes deleted configs from used", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id })
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "deleted",
    })
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].used).toBe(0)
  })

  it("counts configs whose protocol is disabled toward used", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure({
      isEnabled: false,
    })
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id })
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].used).toBe(1)
  })

  it("returns used equal to maxCount when the limit is exactly reached", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id, maxCount: 2 })
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].maxCount).toBe(2)
    expect(parsed[0].used).toBe(2)
  })

  it("returns used greater than maxCount when the database holds more configs than the limit allows", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].maxCount).toBe(1)
    expect(parsed[0].used).toBe(2)
  })

  it("returns a limit with maxCount zero as stored", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id, maxCount: 0 })
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].maxCount).toBe(0)
  })

  it("returns an empty array when the user has no config limit rows", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const configLimits = await getUserConfigLimits(headers)

    expect(configLimits).toEqual([])
  })

  it.todo("returns entries ordered by protocol family ascending")

  it("excludes another user's configs from used", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const otherUser = await insertTestUser()
    await insertTestConfigLimit({ userId: requestUser.id })
    await insertTestConfig({
      userId: requestUser.id,
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
    const configLimits = await getUserConfigLimits(headers)

    const parsed = z.array(ConfigLimitSchema).parse(configLimits)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].used).toBe(1)
  })

  it("omits limits that belong to another user", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const otherUser = await insertTestUser()
    const requestUserConfigLimit = await insertTestConfigLimit({ userId: requestUser.id })
    await insertTestConfigLimit({ userId: otherUser.id })
    const configLimits = await getUserConfigLimits(headers)

    expect(configLimits.map((entry) => entry.id)).toEqual([requestUserConfigLimit.id])
  })

  it("allows an admin user as well", async () => {
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await signInTestUser(adminUser)
    const adminConfigLimit = await insertTestConfigLimit({ userId: adminUser.id })
    const configLimits = await getUserConfigLimits(headers)

    expect(configLimits.map((entry) => entry.id)).toEqual([adminConfigLimit.id])
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expect(getUserConfigLimits(new Headers())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the config limit query throws", async () => {
      vi.mocked(findUserConfigLimits).mockRejectedValueOnce(new Error("Query failure"))

      const requestUser = await insertTestUser()
      const response = await app.request("/api/config-limits", {
        headers: await signInTestUser(requestUser),
      })
      expect(response.status).toBe(500)
    })
  })
})
