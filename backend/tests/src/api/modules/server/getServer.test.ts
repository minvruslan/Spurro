import { randomUUID } from "node:crypto"
import { call } from "@orpc/server"
import { ServerSchema } from "@spurro/api-contract"
import { describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { serverRouter } from "@/api/modules/server/index.js"
import { findServerById } from "@/api/modules/server/queries/findServerById.js"
import { expectOrpcError } from "@tests/assertions/index.js"
import {
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestSession,
  insertTestUser,
  signInTestAdmin,
} from "@tests/helpers/index.js"

vi.mock("@/api/modules/server/queries/findServerById.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/server/queries/findServerById.js")>()
  return { findServerById: vi.fn(original.findServerById) }
})

function callGetServer(id: string, headers: Headers) {
  return call(serverRouter.getServer, { id }, { context: { headers } })
}

describe("GET /servers/{id}", () => {
  it("returns the server matching the contract schema", async () => {
    const serverProtocol = await insertTestProtocol()
    const requestedServer = await insertTestServer()
    await insertTestEndpoint({ serverId: requestedServer.id, protocolId: serverProtocol.id })

    const foundServer = await callGetServer(requestedServer.id, await signInTestAdmin())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.id).toBe(requestedServer.id)
    expect(parsed.name).toBe(requestedServer.name)
    expect(parsed.ip).toBe(requestedServer.ip)
    expect(parsed.country).toBe(requestedServer.country)
    expect(parsed.status).toBe("active")
  })

  it("returns every contract field at every nesting level", async () => {
    const serverProtocol = await insertTestProtocol()
    const requestedServer = await insertTestServer()
    await insertTestEndpoint({ serverId: requestedServer.id, protocolId: serverProtocol.id })

    const foundServer = await callGetServer(requestedServer.id, await signInTestAdmin())

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

    const foundServer = await callGetServer(requestedServer.id, await signInTestAdmin())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.endpoints.map((serverEndpoint) => serverEndpoint.id)).toEqual([
      requestedServerEndpoint.id,
    ])
  })

  it("returns the server with an empty endpoints array when it has no endpoints", async () => {
    const requestedServer = await insertTestServer()

    const foundServer = await callGetServer(requestedServer.id, await signInTestAdmin())

    expect(foundServer.endpoints).toEqual([])
  })

  it.todo("returns the server's endpoints ordered by port ascending")

  it("returns the current server with isCurrent true", async () => {
    const currentServer = await insertTestServer({ isCurrent: true })

    const foundServer = await callGetServer(currentServer.id, await signInTestAdmin())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.isCurrent).toBe(true)
  })

  it("returns a server with status provisioning", async () => {
    const provisioningServer = await insertTestServer({ status: "provisioning" })

    const foundServer = await callGetServer(provisioningServer.id, await signInTestAdmin())

    const parsed = ServerSchema.parse(foundServer)
    expect(parsed.id).toBe(provisioningServer.id)
    expect(parsed.status).toBe("provisioning")
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    await expectOrpcError(callGetServer(randomUUID(), await signInTestAdmin()), "NOT_FOUND")
  })

  it("rejects a non-uuid id with BAD_REQUEST", async () => {
    await expectOrpcError(callGetServer("not-a-uuid", await signInTestAdmin()), "BAD_REQUEST")
  })

  it("rejects an ordinary user with FORBIDDEN", async () => {
    const requestedServer = await insertTestServer()
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(callGetServer(requestedServer.id, headers), "FORBIDDEN")
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    const requestedServer = await insertTestServer()

    await expectOrpcError(callGetServer(requestedServer.id, new Headers()), "UNAUTHORIZED")
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the server query throws", async () => {
      const requestedServer = await insertTestServer()
      vi.mocked(findServerById).mockRejectedValueOnce(new Error("Query failure"))

      const response = await app.request(`/api/servers/${requestedServer.id}`, {
        headers: await signInTestAdmin(),
      })
      expect(response.status).toBe(500)
    })
  })
})
