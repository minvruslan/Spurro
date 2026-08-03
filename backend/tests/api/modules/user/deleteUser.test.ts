import { randomUUID } from "node:crypto"
import { call } from "@orpc/server"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { deleteUserConfigsFromRemoteEndpointService } from "@/api/modules/config/services/deleteUserConfigsFromRemoteEndpointService.js"
import { userRouter } from "@/api/modules/user/index.js"
import { deleteUser } from "@/api/modules/user/queries/deleteUser.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { config, configLimit, deviceType, session, user } from "@/core/database/schemas/index.js"
import { expectOrpcError } from "../../../assertions/index.js"
import {
  insertTestConfig,
  insertTestConfigLimit,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestSession,
  insertTestUser,
  signInTestAdmin,
} from "../../../helpers/index.js"

vi.mock(
  "@/api/modules/config/services/deleteUserConfigsFromRemoteEndpointService.js",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/api/modules/config/services/deleteUserConfigsFromRemoteEndpointService.js")
      >()
    return {
      deleteUserConfigsFromRemoteEndpointService: vi.fn(
        original.deleteUserConfigsFromRemoteEndpointService,
      ),
    }
  },
)

vi.mock("@/api/modules/user/queries/deleteUser.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/api/modules/user/queries/deleteUser.js")>()
  return { deleteUser: vi.fn(original.deleteUser) }
})

function callDeleteUser(id: string, headers: Headers) {
  return call(userRouter.deleteUser, { id }, { context: { headers } })
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

describe("DELETE /users/{id}", () => {
  beforeEach(bootstrapDeviceTypes)

  it("deletes the user and returns their id", async () => {
    const targetUser = await insertTestUser()
    const deleteUserResult = await callDeleteUser(targetUser.id, await signInTestAdmin())

    const parsed = z.object({ id: z.string() }).parse(deleteUserResult)
    expect(parsed).toEqual({ id: targetUser.id })
  })

  it("removes the user row from the database", async () => {
    const targetUser = await insertTestUser()
    await callDeleteUser(targetUser.id, await signInTestAdmin())

    const userRows = await db.select().from(user).where(eq(user.id, targetUser.id))
    expect(userRows).toHaveLength(0)
  })

  it("removes the user's config limits", async () => {
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id })
    await callDeleteUser(targetUser.id, await signInTestAdmin())

    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, targetUser.id))
    expect(configLimitRows).toHaveLength(0)
  })

  it("removes the user's sessions", async () => {
    const targetUser = await insertTestUser()
    await insertTestSession(targetUser)
    await callDeleteUser(targetUser.id, await signInTestAdmin())

    const sessionRows = await db.select().from(session).where(eq(session.userId, targetUser.id))
    expect(sessionRows).toHaveLength(0)
  })

  it("removes the user's config rows", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockResolvedValueOnce({
      ok: true,
      data: null,
    })
    await callDeleteUser(targetUser.id, await signInTestAdmin())

    const configRows = await db.select().from(config).where(eq(config.userId, targetUser.id))
    expect(configRows).toHaveLength(0)
  })

  it("deletes the user's VPN configs on the nodes before removing the user", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    let userRowsDuringNodeCall: { id: string }[] = []
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockImplementationOnce(async () => {
      userRowsDuringNodeCall = await db.select().from(user).where(eq(user.id, targetUser.id))
      return { ok: true, data: null }
    })
    await callDeleteUser(targetUser.id, await signInTestAdmin())

    expect(deleteUserConfigsFromRemoteEndpointService).toHaveBeenCalledTimes(1)
    expect(vi.mocked(deleteUserConfigsFromRemoteEndpointService).mock.calls[0][0]).toBe(
      configEndpoint.id,
    )
    expect(userRowsDuringNodeCall).toHaveLength(1)
    const userRows = await db.select().from(user).where(eq(user.id, targetUser.id))
    expect(userRows).toHaveLength(0)
  })

  it("invokes the remote endpoint deletion once with both configs when the user has two configs on the same endpoint", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
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
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockResolvedValueOnce({
      ok: true,
      data: null,
    })

    await callDeleteUser(targetUser.id, await signInTestAdmin())

    expect(deleteUserConfigsFromRemoteEndpointService).toHaveBeenCalledTimes(1)
    const [calledEndpointId, calledConfigs] = vi.mocked(deleteUserConfigsFromRemoteEndpointService)
      .mock.calls[0]
    expect(calledEndpointId).toBe(configEndpoint.id)
    expect(calledConfigs.map((calledConfig) => calledConfig.id).sort()).toEqual(
      [firstConfig.id, secondConfig.id].sort(),
    )
  })

  it("removes both config rows when the user has two configs on the same endpoint", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
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
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockResolvedValueOnce({
      ok: true,
      data: null,
    })

    await callDeleteUser(targetUser.id, await signInTestAdmin())

    const configRows = await db.select().from(config).where(eq(config.userId, targetUser.id))
    expect(configRows).toHaveLength(0)
  })

  it("leaves another user, their session, config limit and config untouched", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    const targetConfig = await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const bystanderUser = await insertTestUser()
    await insertTestSession(bystanderUser)
    const bystanderConfigLimit = await insertTestConfigLimit({ userId: bystanderUser.id })
    const bystanderConfig = await insertTestConfig({
      userId: bystanderUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockResolvedValueOnce({
      ok: true,
      data: null,
    })

    await callDeleteUser(targetUser.id, await signInTestAdmin())

    const userRows = await db.select().from(user).where(eq(user.id, bystanderUser.id))
    expect(userRows).toHaveLength(1)
    const sessionRows = await db.select().from(session).where(eq(session.userId, bystanderUser.id))
    expect(sessionRows).toHaveLength(1)
    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, bystanderUser.id))
    expect(configLimitRows).toEqual([bystanderConfigLimit])
    const configRows = await db.select().from(config).where(eq(config.userId, bystanderUser.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].id).toBe(bystanderConfig.id)
    expect(configRows[0].status).toBe("active")
    expect(deleteUserConfigsFromRemoteEndpointService).toHaveBeenCalledTimes(1)
    const [calledEndpointId, calledConfigs] = vi.mocked(deleteUserConfigsFromRemoteEndpointService)
      .mock.calls[0]
    expect(calledEndpointId).toBe(configEndpoint.id)
    expect(calledConfigs.map((calledConfig) => calledConfig.id)).toEqual([targetConfig.id])
  })

  it("makes no node calls when the user has no configs", async () => {
    const targetUser = await insertTestUser()
    await callDeleteUser(targetUser.id, await signInTestAdmin())

    expect(deleteUserConfigsFromRemoteEndpointService).not.toHaveBeenCalled()
  })

  it("makes no node calls for configs that are already deleted", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "deleted",
    })
    await callDeleteUser(targetUser.id, await signInTestAdmin())

    expect(deleteUserConfigsFromRemoteEndpointService).not.toHaveBeenCalled()
  })

  it("deletes a user whose used count exceeds their limit's maxCount", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id, maxCount: 0 })
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockResolvedValueOnce({
      ok: true,
      data: null,
    })
    const deleteUserResult = await callDeleteUser(targetUser.id, await signInTestAdmin())

    expect(deleteUserResult).toEqual({ id: targetUser.id })
    const userRows = await db.select().from(user).where(eq(user.id, targetUser.id))
    expect(userRows).toHaveLength(0)
  })

  it("deletes a user who has configs of a protocol family without a config limit row", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockResolvedValueOnce({
      ok: true,
      data: null,
    })
    const deleteUserResult = await callDeleteUser(targetUser.id, await signInTestAdmin())

    expect(deleteUserResult).toEqual({ id: targetUser.id })
    const userRows = await db.select().from(user).where(eq(user.id, targetUser.id))
    expect(userRows).toHaveLength(0)
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    await expectOrpcError(
      callDeleteUser(`unknown-user-${randomUUID()}`, await signInTestAdmin()),
      "NOT_FOUND",
    )
  })

  it("rejects a malformed identifier with NOT_FOUND", async () => {
    await expectOrpcError(
      callDeleteUser("%%%not-a-user-id%%%", await signInTestAdmin()),
      "NOT_FOUND",
    )
  })

  it("returns CONFIG_DELETE_FAILED when a node holding the user's configs is unreachable", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockResolvedValueOnce({
      ok: false,
      errorCode: "unavailable",
      error: new Error("Node unreachable"),
    })

    await expectOrpcError(
      callDeleteUser(targetUser.id, await signInTestAdmin()),
      "CONFIG_DELETE_FAILED",
    )
  })

  it("keeps the user, their limits and their configs when node config deletion fails", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfigLimit({ userId: targetUser.id })
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockResolvedValueOnce({
      ok: false,
      errorCode: "unavailable",
      error: new Error("Node unreachable"),
    })

    await callDeleteUser(targetUser.id, await signInTestAdmin()).catch(() => undefined)

    const userRows = await db.select().from(user).where(eq(user.id, targetUser.id))
    expect(userRows).toHaveLength(1)
    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, targetUser.id))
    expect(configLimitRows).toHaveLength(1)
    const configRows = await db.select().from(config).where(eq(config.userId, targetUser.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].status).toBe("deleting")
  })

  it("responds with HTTP 502 when node config deletion fails", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockResolvedValueOnce({
      ok: false,
      errorCode: "unavailable",
      error: new Error("Node unreachable"),
    })

    const response = await app.request(`/api/users/${targetUser.id}`, {
      method: "DELETE",
      headers: await signInTestAdmin(),
    })

    expect(response.status).toBe(502)
  })

  it("deletes configs on the reachable node and returns CONFIG_DELETE_FAILED when another node fails", async () => {
    const configProtocol = await insertTestProtocol()
    const reachableServer = await insertTestServer()
    const unreachableServer = await insertTestServer()
    const reachableEndpoint = await insertTestEndpoint({
      serverId: reachableServer.id,
      protocolId: configProtocol.id,
    })
    const unreachableEndpoint = await insertTestEndpoint({
      serverId: unreachableServer.id,
      protocolId: configProtocol.id,
    })
    const [configDeviceType] = await db.select().from(deviceType).limit(1)
    const targetUser = await insertTestUser()
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: reachableEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    const unreachableConfig = await insertTestConfig({
      userId: targetUser.id,
      endpointId: unreachableEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockImplementation(async (endpointId) => {
      if (endpointId === unreachableEndpoint.id) {
        return { ok: false, errorCode: "unavailable", error: new Error("Node unreachable") }
      }
      return { ok: true, data: null }
    })

    await expectOrpcError(
      callDeleteUser(targetUser.id, await signInTestAdmin()),
      "CONFIG_DELETE_FAILED",
    )

    const calledEndpointIds = vi
      .mocked(deleteUserConfigsFromRemoteEndpointService)
      .mock.calls.map((mockCall) => mockCall[0])
    expect(calledEndpointIds.sort()).toEqual([reachableEndpoint.id, unreachableEndpoint.id].sort())
    const userRows = await db.select().from(user).where(eq(user.id, targetUser.id))
    expect(userRows).toHaveLength(1)
    const unreachableConfigRows = await db
      .select()
      .from(config)
      .where(eq(config.id, unreachableConfig.id))
    expect(unreachableConfigRows).toHaveLength(1)
    expect(unreachableConfigRows[0].status).toBe("deleting")
  })

  it("returns CONFIGS_APPEARED when a new config is created for the user during deletion", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockImplementationOnce(async () => {
      await insertTestConfig({
        userId: targetUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
      })
      return { ok: true, data: null }
    })

    await expectOrpcError(
      callDeleteUser(targetUser.id, await signInTestAdmin()),
      "CONFIGS_APPEARED",
    )
  })

  it("keeps the user when configs appeared during deletion", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockImplementationOnce(async () => {
      await insertTestConfig({
        userId: targetUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
      })
      return { ok: true, data: null }
    })

    await callDeleteUser(targetUser.id, await signInTestAdmin()).catch(() => undefined)

    const userRows = await db.select().from(user).where(eq(user.id, targetUser.id))
    expect(userRows).toHaveLength(1)
  })

  it("responds with HTTP 409 when configs appeared during deletion", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const targetUser = await insertTestUser()
    await insertTestConfig({
      userId: targetUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })
    vi.mocked(deleteUserConfigsFromRemoteEndpointService).mockImplementationOnce(async () => {
      await insertTestConfig({
        userId: targetUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
      })
      return { ok: true, data: null }
    })

    const response = await app.request(`/api/users/${targetUser.id}`, {
      method: "DELETE",
      headers: await signInTestAdmin(),
    })

    expect(response.status).toBe(409)
  })

  it("rejects deleting a user with role admin with NOT_FOUND", async () => {
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await insertTestSession(adminUser)

    await expectOrpcError(callDeleteUser(adminUser.id, headers), "NOT_FOUND")
    const userRows = await db.select().from(user).where(eq(user.id, adminUser.id))
    expect(userRows).toHaveLength(1)
  })

  it("rejects an ordinary user deleting another user with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)
    const targetUser = await insertTestUser()

    await expectOrpcError(callDeleteUser(targetUser.id, headers), "FORBIDDEN")
  })

  it("rejects an ordinary user deleting their own account with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(callDeleteUser(requestUser.id, headers), "FORBIDDEN")
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    const targetUser = await insertTestUser()

    await expectOrpcError(callDeleteUser(targetUser.id, new Headers()), "UNAUTHORIZED")
  })

  describe("technical", () => {
    it("rejects with NOT_FOUND when the user row vanishes between lookup and deletion", async () => {
      const targetUser = await insertTestUser()
      vi.mocked(deleteUser).mockResolvedValueOnce([])

      await expectOrpcError(callDeleteUser(targetUser.id, await signInTestAdmin()), "NOT_FOUND")
    })

    it("responds with HTTP 500 when the user delete throws", async () => {
      const targetUser = await insertTestUser()
      vi.mocked(deleteUser).mockRejectedValueOnce(new Error("Delete failure"))

      const response = await app.request(`/api/users/${targetUser.id}`, {
        method: "DELETE",
        headers: await signInTestAdmin(),
      })
      expect(response.status).toBe(500)
    })
  })
})
