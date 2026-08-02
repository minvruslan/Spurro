import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { EndpointSchema, type Protocol } from "@spurro/api-contract"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { endpointRouter } from "@/api/modules/endpoint/index.js"
import { findActiveEndpoints } from "@/api/modules/endpoint/queries/findActiveEndpoints.js"
import { db } from "@/core/database/index.js"
import { config, endpoint, protocol, server } from "@/core/database/schemas/index.js"
import {
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestUser,
  signInTestUser,
} from "../../../helpers/index.js"

vi.mock("@/api/modules/endpoint/queries/findActiveEndpoints.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/endpoint/queries/findActiveEndpoints.js")>()
  return { findActiveEndpoints: vi.fn(original.findActiveEndpoints) }
})

const getEndpoints = (headers: Headers) =>
  call(endpointRouter.getEndpoints, undefined, { context: { headers } })

async function authorizedHeaders(role?: string) {
  const requestUser = await insertTestUser(role ? { role } : {})
  return signInTestUser(requestUser)
}

describe("GET /endpoints", () => {
  beforeEach(async () => {
    await db.delete(config)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
  })

  it("returns active endpoints of active servers matching the contract schema", async () => {
    const endpointProtocol = await insertTestProtocol()
    const endpointServer = await insertTestServer()
    const activeEndpoint = await insertTestEndpoint({
      serverId: endpointServer.id,
      protocolId: endpointProtocol.id,
    })
    const endpoints = await getEndpoints(await authorizedHeaders())

    const parsed = z.array(EndpointSchema).parse(endpoints)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe(activeEndpoint.id)
    expect(parsed[0].port).toBe(activeEndpoint.port)
    expect(parsed[0].protocol.id).toBe(endpointProtocol.id)
    expect(parsed[0].server.id).toBe(endpointServer.id)
    expect(parsed[0].server.name).toBe(endpointServer.name)
    expect(parsed[0].server.country).toBe(endpointServer.country)
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const endpointProtocol = await insertTestProtocol()
    const endpointServer = await insertTestServer()
    await insertTestEndpoint({ serverId: endpointServer.id, protocolId: endpointProtocol.id })
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints).toHaveLength(1)
    for (const entry of endpoints) {
      expect(Object.keys(entry).sort()).toEqual(["id", "port", "protocol", "server"])
      expect(Object.keys(entry.protocol).sort()).toEqual(["code", "family", "id", "name"])
      expect(Object.keys(entry.server).sort()).toEqual(["country", "id", "name"])
    }
  })

  it("returns each endpoint protocol with the family matching its code", async () => {
    const expectedFamiliesByCode: Record<Protocol["code"], Protocol["family"]> = {
      amneziawg2: "amneziawg",
    }
    const endpointProtocol = await insertTestProtocol()
    const endpointServer = await insertTestServer()
    await insertTestEndpoint({ serverId: endpointServer.id, protocolId: endpointProtocol.id })
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints).toHaveLength(1)
    for (const entry of endpoints) {
      expect(entry.protocol.family).toBe(expectedFamiliesByCode[entry.protocol.code])
    }
  })

  it.todo("returns one entry per active endpoint when a server hosts several protocols")

  it("returns only the active endpoint when a deleted endpoint shares its server and protocol", async () => {
    const endpointProtocol = await insertTestProtocol()
    const endpointServer = await insertTestServer()
    await insertTestEndpoint({
      serverId: endpointServer.id,
      protocolId: endpointProtocol.id,
      port: 51820,
      status: "deleted",
    })
    const activeEndpoint = await insertTestEndpoint({
      serverId: endpointServer.id,
      protocolId: endpointProtocol.id,
      port: 51821,
    })
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints.map((entry) => entry.id)).toEqual([activeEndpoint.id])
  })

  it("omits endpoints with status deleted", async () => {
    const endpointProtocol = await insertTestProtocol()
    const endpointServer = await insertTestServer()
    const deletedEndpoint = await insertTestEndpoint({
      serverId: endpointServer.id,
      protocolId: endpointProtocol.id,
      status: "deleted",
    })
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints.map((entry) => entry.id)).not.toContain(deletedEndpoint.id)
  })

  it("omits endpoints of servers with status deleted", async () => {
    const endpointProtocol = await insertTestProtocol()
    const deletedServer = await insertTestServer({ status: "deleted" })
    const deletedServerEndpoint = await insertTestEndpoint({
      serverId: deletedServer.id,
      protocolId: endpointProtocol.id,
    })
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints.map((entry) => entry.id)).not.toContain(deletedServerEndpoint.id)
  })

  it("omits endpoints of servers with status provisioning", async () => {
    const endpointProtocol = await insertTestProtocol()
    const provisioningServer = await insertTestServer({ status: "provisioning" })
    const provisioningServerEndpoint = await insertTestEndpoint({
      serverId: provisioningServer.id,
      protocolId: endpointProtocol.id,
    })
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints.map((entry) => entry.id)).not.toContain(provisioningServerEndpoint.id)
  })

  it("omits endpoints of servers with status failed", async () => {
    const endpointProtocol = await insertTestProtocol()
    const failedServer = await insertTestServer({ status: "failed" })
    const failedServerEndpoint = await insertTestEndpoint({
      serverId: failedServer.id,
      protocolId: endpointProtocol.id,
    })
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints.map((entry) => entry.id)).not.toContain(failedServerEndpoint.id)
  })

  it("keeps listing endpoints whose protocol is disabled", async () => {
    const disabledProtocol = await insertTestProtocol({ isEnabled: false })
    const endpointServer = await insertTestServer()
    const disabledProtocolEndpoint = await insertTestEndpoint({
      serverId: endpointServer.id,
      protocolId: disabledProtocol.id,
    })
    const endpoints = await getEndpoints(await authorizedHeaders())

    const parsed = z.array(EndpointSchema).parse(endpoints)
    expect(parsed.map((entry) => entry.id)).toContain(disabledProtocolEndpoint.id)
  })

  it("returns entries ordered by server name ascending", async () => {
    const endpointProtocol = await insertTestProtocol()
    const bravoServer = await insertTestServer({
      name: `Bravo Server ${randomUUID()}`,
      country: "BB",
    })
    const charlieServer = await insertTestServer({
      name: `Charlie Server ${randomUUID()}`,
      country: "AA",
    })
    const alphaServer = await insertTestServer({
      name: `Alpha Server ${randomUUID()}`,
      country: "CC",
    })
    await insertTestEndpoint({ serverId: bravoServer.id, protocolId: endpointProtocol.id })
    await insertTestEndpoint({ serverId: charlieServer.id, protocolId: endpointProtocol.id })
    await insertTestEndpoint({ serverId: alphaServer.id, protocolId: endpointProtocol.id })
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints.map((entry) => entry.server.name)).toEqual([
      alphaServer.name,
      bravoServer.name,
      charlieServer.name,
    ])
  })

  it("returns entries with equal server names ordered by port ascending", async () => {
    const endpointProtocol = await insertTestProtocol()
    const sharedServerName = `Shared Server ${randomUUID()}`
    const firstServer = await insertTestServer({ name: sharedServerName })
    const secondServer = await insertTestServer({ name: sharedServerName })
    const higherPortEndpoint = await insertTestEndpoint({
      serverId: firstServer.id,
      protocolId: endpointProtocol.id,
      port: 51821,
    })
    const lowerPortEndpoint = await insertTestEndpoint({
      serverId: secondServer.id,
      protocolId: endpointProtocol.id,
      port: 51820,
    })
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints.map((entry) => entry.id)).toEqual([
      lowerPortEndpoint.id,
      higherPortEndpoint.id,
    ])
  })

  it("returns an empty array when every endpoint is deleted", async () => {
    const endpointProtocol = await insertTestProtocol()
    const firstServer = await insertTestServer()
    const secondServer = await insertTestServer()
    await insertTestEndpoint({
      serverId: firstServer.id,
      protocolId: endpointProtocol.id,
      status: "deleted",
    })
    await insertTestEndpoint({
      serverId: secondServer.id,
      protocolId: endpointProtocol.id,
      status: "deleted",
    })
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints).toEqual([])
  })

  it("returns an empty array when no endpoints exist", async () => {
    const endpoints = await getEndpoints(await authorizedHeaders())

    expect(endpoints).toEqual([])
  })

  it("allows an admin user as well", async () => {
    const endpointProtocol = await insertTestProtocol()
    const endpointServer = await insertTestServer()
    const activeEndpoint = await insertTestEndpoint({
      serverId: endpointServer.id,
      protocolId: endpointProtocol.id,
    })
    const endpoints = await getEndpoints(await authorizedHeaders("admin"))

    expect(endpoints.map((entry) => entry.id)).toEqual([activeEndpoint.id])
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expect(getEndpoints(new Headers())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the endpoint query throws", async () => {
      vi.mocked(findActiveEndpoints).mockRejectedValueOnce(new Error("Query failure"))

      const response = await app.request("/api/endpoints", {
        headers: await authorizedHeaders(),
      })
      expect(response.status).toBe(500)
    })
  })
})
