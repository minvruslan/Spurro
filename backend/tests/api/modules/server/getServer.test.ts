import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { type Protocol, ServerSchema } from "@spurro/api-contract"
import { beforeEach, describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { serverRouter } from "@/api/modules/server/index.js"
import { findServerById } from "@/api/modules/server/queries/findServerById.js"
import { db } from "@/core/database/index.js"
import { config, endpoint, protocol, server } from "@/core/database/schemas/index.js"
import {
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

const getServer = (id: string, headers: Headers) =>
  call(serverRouter.getServer, { id }, { context: { headers } })

async function adminHeaders() {
  const requestUser = await insertTestUser({ role: "admin" })
  return signInTestUser(requestUser)
}

describe("GET /servers/{id}", () => {
  beforeEach(async () => {
    await db.delete(config)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
  })

  it("returns the server matching the contract schema", async () => {
    const serverProtocol = await insertTestProtocol()
    const requestedServer = await insertTestServer()
    await insertTestEndpoint({ serverId: requestedServer.id, protocolId: serverProtocol.id })
    const foundServer = await getServer(requestedServer.id, await adminHeaders())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.id).toBe(requestedServer.id)
    expect(parsed.name).toBe(requestedServer.name)
    expect(parsed.ip).toBe(requestedServer.ip)
    expect(parsed.country).toBe(requestedServer.country)
    expect(parsed.status).toBe("active")
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const serverProtocol = await insertTestProtocol()
    const requestedServer = await insertTestServer()
    await insertTestEndpoint({ serverId: requestedServer.id, protocolId: serverProtocol.id })
    const foundServer = await getServer(requestedServer.id, await adminHeaders())

    expect(Object.keys(foundServer).sort()).toEqual([
      "country",
      "createdAt",
      "domainName",
      "endpoints",
      "id",
      "ip",
      "isCurrent",
      "name",
      "status",
      "updatedAt",
    ])
    expect(foundServer.endpoints).toHaveLength(1)
    for (const serverEndpoint of foundServer.endpoints) {
      expect(Object.keys(serverEndpoint).sort()).toEqual(["id", "port", "protocol", "status"])
      expect(Object.keys(serverEndpoint.protocol).sort()).toEqual(["code", "family", "id", "name"])
    }
  })

  it("returns the server endpoint protocol with the family matching its code", async () => {
    const expectedFamiliesByCode: Record<Protocol["code"], Protocol["family"]> = {
      amneziawg2: "amneziawg",
    }
    const serverProtocol = await insertTestProtocol()
    const requestedServer = await insertTestServer()
    await insertTestEndpoint({ serverId: requestedServer.id, protocolId: serverProtocol.id })
    const foundServer = await getServer(requestedServer.id, await adminHeaders())

    expect(foundServer.endpoints).toHaveLength(1)
    for (const serverEndpoint of foundServer.endpoints) {
      expect(serverEndpoint.protocol.family).toBe(
        expectedFamiliesByCode[serverEndpoint.protocol.code],
      )
    }
  })

  it("returns only the endpoints belonging to the requested server", async () => {
    const serverProtocol = await insertTestProtocol()
    const requestedServer = await insertTestServer()
    const otherServer = await insertTestServer()
    const requestedServerEndpoint = await insertTestEndpoint({
      serverId: requestedServer.id,
      protocolId: serverProtocol.id,
      port: 51820,
    })
    await insertTestEndpoint({
      serverId: otherServer.id,
      protocolId: serverProtocol.id,
      port: 51821,
    })
    const foundServer = await getServer(requestedServer.id, await adminHeaders())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.endpoints.map((serverEndpoint) => serverEndpoint.id)).toEqual([
      requestedServerEndpoint.id,
    ])
  })

  it("returns the server with an empty endpoints array when it has no endpoints", async () => {
    const requestedServer = await insertTestServer()
    const foundServer = await getServer(requestedServer.id, await adminHeaders())

    expect(foundServer.endpoints).toEqual([])
  })

  it("returns the server's endpoints of every status including deleted", async () => {
    const serverProtocol = await insertTestProtocol()
    const requestedServer = await insertTestServer()
    const deletedEndpoint = await insertTestEndpoint({
      serverId: requestedServer.id,
      protocolId: serverProtocol.id,
      port: 51821,
      status: "deleted",
    })
    const activeEndpoint = await insertTestEndpoint({
      serverId: requestedServer.id,
      protocolId: serverProtocol.id,
      port: 51820,
    })
    const foundServer = await getServer(requestedServer.id, await adminHeaders())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.endpoints).toHaveLength(2)
    expect(
      parsed.endpoints.find((serverEndpoint) => serverEndpoint.id === activeEndpoint.id)?.status,
    ).toBe("active")
    expect(
      parsed.endpoints.find((serverEndpoint) => serverEndpoint.id === deletedEndpoint.id)?.status,
    ).toBe("deleted")
  })

  it("returns the server's endpoints ordered by port ascending", async () => {
    const serverProtocol = await insertTestProtocol()
    const requestedServer = await insertTestServer()
    await insertTestEndpoint({
      serverId: requestedServer.id,
      protocolId: serverProtocol.id,
      port: 51821,
      status: "deleted",
    })
    await insertTestEndpoint({
      serverId: requestedServer.id,
      protocolId: serverProtocol.id,
      port: 51820,
    })
    const foundServer = await getServer(requestedServer.id, await adminHeaders())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.endpoints.map((serverEndpoint) => serverEndpoint.port)).toEqual([51820, 51821])
  })

  it("returns the current server with isCurrent true", async () => {
    const currentServer = await insertTestServer({ isCurrent: true })
    const foundServer = await getServer(currentServer.id, await adminHeaders())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.isCurrent).toBe(true)
  })

  it("returns a server with status provisioning", async () => {
    const provisioningServer = await insertTestServer({ status: "provisioning" })
    const foundServer = await getServer(provisioningServer.id, await adminHeaders())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.id).toBe(provisioningServer.id)
    expect(parsed.status).toBe("provisioning")
  })

  it("returns a server with status failed", async () => {
    const failedServer = await insertTestServer({ status: "failed" })
    const foundServer = await getServer(failedServer.id, await adminHeaders())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.id).toBe(failedServer.id)
    expect(parsed.status).toBe("failed")
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    await expect(getServer(randomUUID(), await adminHeaders())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    )
  })

  it("rejects a soft-deleted server with NOT_FOUND", async () => {
    const deletedServer = await insertTestServer({ status: "deleted" })

    await expect(getServer(deletedServer.id, await adminHeaders())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    )
  })

  it("rejects a non-uuid id with BAD_REQUEST", async () => {
    await expect(getServer("not-a-uuid", await adminHeaders())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "BAD_REQUEST",
    )
  })

  it("rejects an ordinary user with FORBIDDEN", async () => {
    const requestedServer = await insertTestServer()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(getServer(requestedServer.id, headers)).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "FORBIDDEN",
    )
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    const requestedServer = await insertTestServer()

    await expect(getServer(requestedServer.id, new Headers())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the server query throws", async () => {
      const requestedServer = await insertTestServer()
      vi.mocked(findServerById).mockRejectedValueOnce(new Error("Query failure"))

      const response = await app.request(`/api/servers/${requestedServer.id}`, {
        headers: await adminHeaders(),
      })
      expect(response.status).toBe(500)
    })
  })
})
