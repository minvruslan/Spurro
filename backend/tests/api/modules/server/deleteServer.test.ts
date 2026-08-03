import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { serverRouter } from "@/api/modules/server/index.js"
import { deleteServer } from "@/api/modules/server/queries/deleteServer.js"
import { findServerById } from "@/api/modules/server/queries/findServerById.js"
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

vi.mock("@/api/modules/server/queries/findServerById.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/server/queries/findServerById.js")>()
  return { findServerById: vi.fn(original.findServerById) }
})

vi.mock("@/api/modules/server/queries/deleteServer.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/server/queries/deleteServer.js")>()
  return { deleteServer: vi.fn(original.deleteServer) }
})

type ConfigStatus = NonNullable<(typeof config.$inferInsert)["status"]>

const callDeleteServer = (id: string, headers: Headers) =>
  call(serverRouter.deleteServer, { id }, { context: { headers } })

async function adminHeaders() {
  const requestUser = await insertTestUser({ role: "admin" })
  return signInTestUser(requestUser)
}

async function insertServerWithEndpoint(
  serverOverrides: Partial<typeof server.$inferInsert> = {},
  serverProtocol?: typeof protocol.$inferSelect,
) {
  const endpointProtocol = serverProtocol ?? (await insertTestProtocol())
  const deletedServer = await insertTestServer(serverOverrides)
  const deletedEndpoint = await insertTestEndpoint({
    serverId: deletedServer.id,
    protocolId: endpointProtocol.id,
  })
  return { endpointProtocol, deletedServer, deletedEndpoint }
}

async function insertConfigOnEndpoint(endpointId: string, status: ConfigStatus) {
  const configUser = await insertTestUser()
  const [configDeviceType] = await db.select().from(deviceType).limit(1)
  if (!configDeviceType) {
    throw new Error(
      "Device type catalog is empty — is another test process truncating the database?",
    )
  }
  return insertTestConfig({
    userId: configUser.id,
    endpointId,
    deviceTypeId: configDeviceType.id,
    status,
  })
}

describe("DELETE /servers/{id}", () => {
  beforeEach(async () => {
    await db.delete(config)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
    await db.delete(deviceType)
    await bootstrapDeviceTypes()
  })

  it("deletes a server without configs and returns its id matching the contract output", async () => {
    const deletedServer = await insertTestServer()
    const deleteServerResult = await callDeleteServer(deletedServer.id, await adminHeaders())

    const parsed = z.object({ id: z.uuid() }).parse(deleteServerResult)
    expect(parsed).toEqual({ id: deletedServer.id })
  })

  it("exposes exactly the contract fields and nothing more", async () => {
    const deletedServer = await insertTestServer()
    const deleteServerResult = await callDeleteServer(deletedServer.id, await adminHeaders())

    expect(Object.keys(deleteServerResult)).toEqual(["id"])
  })

  it("hard-deletes the server row when no configs are reserved for it", async () => {
    const { deletedServer } = await insertServerWithEndpoint()
    await callDeleteServer(deletedServer.id, await adminHeaders())

    const serverRows = await db.select().from(server).where(eq(server.id, deletedServer.id))
    expect(serverRows).toHaveLength(0)
  })

  it("hard-deletes the server's endpoint rows along with the server", async () => {
    const { deletedServer } = await insertServerWithEndpoint()
    await callDeleteServer(deletedServer.id, await adminHeaders())

    const endpointRows = await db
      .select()
      .from(endpoint)
      .where(eq(endpoint.serverId, deletedServer.id))
    expect(endpointRows).toHaveLength(0)
  })

  it("hard-deletes a server when reserved configs exist only on other servers", async () => {
    const { endpointProtocol, deletedServer } = await insertServerWithEndpoint()
    const { deletedServer: otherServer, deletedEndpoint: otherServerEndpoint } =
      await insertServerWithEndpoint({}, endpointProtocol)
    const otherServerConfig = await insertConfigOnEndpoint(otherServerEndpoint.id, "active")
    await callDeleteServer(deletedServer.id, await adminHeaders())

    const serverRows = await db.select().from(server).where(eq(server.id, deletedServer.id))
    expect(serverRows).toHaveLength(0)
    const otherServerRows = await db.select().from(server).where(eq(server.id, otherServer.id))
    expect(otherServerRows).toHaveLength(1)
    expect(otherServerRows[0]?.status).toBe(otherServer.status)
    const otherServerEndpointRows = await db
      .select()
      .from(endpoint)
      .where(eq(endpoint.id, otherServerEndpoint.id))
    expect(otherServerEndpointRows).toHaveLength(1)
    expect(otherServerEndpointRows[0]?.status).toBe(otherServerEndpoint.status)
    const otherServerConfigRows = await db
      .select()
      .from(config)
      .where(eq(config.id, otherServerConfig.id))
    expect(otherServerConfigRows).toHaveLength(1)
    expect(otherServerConfigRows[0]?.status).toBe(otherServerConfig.status)
  })

  it("soft-deletes the server keeping the row with status deleted when an active config is issued on its endpoints", async () => {
    const { deletedServer, deletedEndpoint } = await insertServerWithEndpoint()
    await insertConfigOnEndpoint(deletedEndpoint.id, "active")
    await callDeleteServer(deletedServer.id, await adminHeaders())

    const serverRows = await db.select().from(server).where(eq(server.id, deletedServer.id))
    expect(serverRows).toHaveLength(1)
    expect(serverRows[0]?.status).toBe("deleted")
  })

  it("soft-deletes the server when a pending config is reserved on its endpoints", async () => {
    const { deletedServer, deletedEndpoint } = await insertServerWithEndpoint()
    await insertConfigOnEndpoint(deletedEndpoint.id, "pending")
    await callDeleteServer(deletedServer.id, await adminHeaders())

    const serverRows = await db.select().from(server).where(eq(server.id, deletedServer.id))
    expect(serverRows).toHaveLength(1)
    expect(serverRows[0]?.status).toBe("deleted")
  })

  it("hard-deletes a server and its config rows when its configs are all in status deleted", async () => {
    const { deletedServer, deletedEndpoint } = await insertServerWithEndpoint()
    const deletedConfig = await insertConfigOnEndpoint(deletedEndpoint.id, "deleted")
    await callDeleteServer(deletedServer.id, await adminHeaders())

    const serverRows = await db.select().from(server).where(eq(server.id, deletedServer.id))
    expect(serverRows).toHaveLength(0)
    const configRows = await db.select().from(config).where(eq(config.id, deletedConfig.id))
    expect(configRows).toHaveLength(0)
  })

  it("keeps the endpoint rows when the server is soft-deleted", async () => {
    const { deletedServer, deletedEndpoint } = await insertServerWithEndpoint()
    await insertConfigOnEndpoint(deletedEndpoint.id, "active")
    await callDeleteServer(deletedServer.id, await adminHeaders())

    const endpointRows = await db
      .select()
      .from(endpoint)
      .where(eq(endpoint.serverId, deletedServer.id))
    expect(endpointRows).toHaveLength(1)
    expect(endpointRows[0]?.id).toBe(deletedEndpoint.id)
    expect(endpointRows[0]?.status).toBe("deleted")
  })

  it("keeps the config rows when the server is soft-deleted", async () => {
    const { deletedServer, deletedEndpoint } = await insertServerWithEndpoint()
    const reservedConfig = await insertConfigOnEndpoint(deletedEndpoint.id, "active")
    await callDeleteServer(deletedServer.id, await adminHeaders())

    const configRows = await db.select().from(config).where(eq(config.id, reservedConfig.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0]?.status).toBe("deleted")
  })

  it("rejects the current server with CURRENT_SERVER and HTTP 409", async () => {
    const currentServer = await insertTestServer({ isCurrent: true })

    const response = await app.request(`/api/servers/${currentServer.id}`, {
      method: "DELETE",
      headers: await adminHeaders(),
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: "CURRENT_SERVER" })
  })

  it("keeps the current server row untouched when the delete is rejected", async () => {
    const currentServer = await insertTestServer({ isCurrent: true })

    await expect(callDeleteServer(currentServer.id, await adminHeaders())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "CURRENT_SERVER",
    )

    const serverRows = await db.select().from(server).where(eq(server.id, currentServer.id))
    expect(serverRows).toHaveLength(1)
    expect(serverRows[0]?.status).toBe(currentServer.status)
    expect(serverRows[0]?.isCurrent).toBe(true)
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    await expect(callDeleteServer(randomUUID(), await adminHeaders())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    )
  })

  it("rejects an already soft-deleted server with NOT_FOUND", async () => {
    const alreadyDeletedServer = await insertTestServer({ status: "deleted" })

    await expect(callDeleteServer(alreadyDeletedServer.id, await adminHeaders())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    )
  })

  it("rejects a non-uuid id with BAD_REQUEST", async () => {
    await expect(callDeleteServer("not-a-uuid", await adminHeaders())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "BAD_REQUEST",
    )
  })

  it("rejects an ordinary user with FORBIDDEN", async () => {
    const deletedServer = await insertTestServer()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(callDeleteServer(deletedServer.id, headers)).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "FORBIDDEN",
    )
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    const deletedServer = await insertTestServer()

    await expect(callDeleteServer(deletedServer.id, new Headers())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    )
  })

  it("keeps the server row when the requester is not an admin", async () => {
    const deletedServer = await insertTestServer()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(callDeleteServer(deletedServer.id, headers)).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "FORBIDDEN",
    )

    const serverRows = await db.select().from(server).where(eq(server.id, deletedServer.id))
    expect(serverRows).toHaveLength(1)
    expect(serverRows[0]?.status).toBe(deletedServer.status)
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the server query throws", async () => {
      const deletedServer = await insertTestServer()
      vi.mocked(findServerById).mockRejectedValueOnce(new Error("Query failure"))

      const response = await app.request(`/api/servers/${deletedServer.id}`, {
        method: "DELETE",
        headers: await adminHeaders(),
      })

      expect(response.status).toBe(500)
    })

    it("keeps the server and endpoint rows when the delete query throws", async () => {
      const { deletedServer, deletedEndpoint } = await insertServerWithEndpoint()
      vi.mocked(deleteServer).mockRejectedValueOnce(new Error("Delete failure"))

      await expect(callDeleteServer(deletedServer.id, await adminHeaders())).rejects.toThrow()

      const serverRows = await db.select().from(server).where(eq(server.id, deletedServer.id))
      expect(serverRows).toHaveLength(1)
      const endpointRows = await db
        .select()
        .from(endpoint)
        .where(eq(endpoint.id, deletedEndpoint.id))
      expect(endpointRows).toHaveLength(1)
    })
  })
})
