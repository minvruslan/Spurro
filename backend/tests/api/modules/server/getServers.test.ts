import { call, ORPCError } from "@orpc/server"
import { type Protocol, ServerSchema } from "@spurro/api-contract"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { serverRouter } from "@/api/modules/server/index.js"
import { findServers } from "@/api/modules/server/queries/findServers.js"
import { db } from "@/core/database/index.js"
import { config, endpoint, protocol, server } from "@/core/database/schemas/index.js"
import {
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestUser,
  signInTestUser,
} from "../../../helpers/index.js"

vi.mock("@/api/modules/server/queries/findServers.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/server/queries/findServers.js")>()
  return { findServers: vi.fn(original.findServers) }
})

const getServers = (headers: Headers) =>
  call(serverRouter.getServers, undefined, { context: { headers } })

async function adminHeaders() {
  const requestUser = await insertTestUser({ role: "admin" })
  return signInTestUser(requestUser)
}

describe("GET /servers", () => {
  beforeEach(async () => {
    await db.delete(config)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
  })

  it("returns all servers matching the contract schema", async () => {
    const serverProtocol = await insertTestProtocol()
    const firstServer = await insertTestServer()
    const secondServer = await insertTestServer()
    await insertTestEndpoint({ serverId: firstServer.id, protocolId: serverProtocol.id })
    const servers = await getServers(await adminHeaders())

    const parsed = z.array(ServerSchema).parse(servers)
    expect(parsed).toHaveLength(2)
    expect(parsed.map((entry) => entry.id).sort()).toEqual([firstServer.id, secondServer.id].sort())
    const parsedFirstServer = parsed.find((entry) => entry.id === firstServer.id)
    expect(parsedFirstServer?.name).toBe(firstServer.name)
    expect(parsedFirstServer?.ip).toBe(firstServer.ip)
    expect(parsedFirstServer?.country).toBe(firstServer.country)
    expect(parsedFirstServer?.status).toBe("active")
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const serverProtocol = await insertTestProtocol()
    const listedServer = await insertTestServer()
    await insertTestEndpoint({ serverId: listedServer.id, protocolId: serverProtocol.id })
    const servers = await getServers(await adminHeaders())

    expect(servers).toHaveLength(1)
    for (const entry of servers) {
      expect(Object.keys(entry).sort()).toEqual([
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
      expect(entry.endpoints).toHaveLength(1)
      for (const serverEndpoint of entry.endpoints) {
        expect(Object.keys(serverEndpoint).sort()).toEqual(["id", "port", "protocol", "status"])
        expect(Object.keys(serverEndpoint.protocol).sort()).toEqual([
          "code",
          "family",
          "id",
          "name",
        ])
      }
    }
  })

  it("returns each server endpoint protocol with the family matching its code", async () => {
    const expectedFamiliesByCode: Record<Protocol["code"], Protocol["family"]> = {
      amneziawg2: "amneziawg",
    }
    const serverProtocol = await insertTestProtocol()
    const listedServer = await insertTestServer()
    await insertTestEndpoint({ serverId: listedServer.id, protocolId: serverProtocol.id })
    const servers = await getServers(await adminHeaders())

    expect(servers).toHaveLength(1)
    for (const entry of servers) {
      expect(entry.endpoints).toHaveLength(1)
      for (const serverEndpoint of entry.endpoints) {
        expect(serverEndpoint.protocol.family).toBe(
          expectedFamiliesByCode[serverEndpoint.protocol.code],
        )
      }
    }
  })

  it("returns each server with the endpoints belonging to it and no other server's", async () => {
    const serverProtocol = await insertTestProtocol()
    const firstServer = await insertTestServer()
    const secondServer = await insertTestServer()
    const firstServerEndpoint = await insertTestEndpoint({
      serverId: firstServer.id,
      protocolId: serverProtocol.id,
      port: 51820,
    })
    const secondServerEndpoint = await insertTestEndpoint({
      serverId: secondServer.id,
      protocolId: serverProtocol.id,
      port: 51821,
    })
    const servers = await getServers(await adminHeaders())

    const parsed = z.array(ServerSchema).parse(servers)
    expect(
      parsed
        .find((entry) => entry.id === firstServer.id)
        ?.endpoints.map((serverEndpoint) => serverEndpoint.id),
    ).toEqual([firstServerEndpoint.id])
    expect(
      parsed
        .find((entry) => entry.id === secondServer.id)
        ?.endpoints.map((serverEndpoint) => serverEndpoint.id),
    ).toEqual([secondServerEndpoint.id])
  })

  it("returns the current server with isCurrent true", async () => {
    const currentServer = await insertTestServer({ isCurrent: true })
    const servers = await getServers(await adminHeaders())

    const parsed = z.array(ServerSchema).parse(servers)
    expect(parsed.find((entry) => entry.id === currentServer.id)?.isCurrent).toBe(true)
  })

  it("returns servers with status provisioning", async () => {
    const provisioningServer = await insertTestServer({ status: "provisioning" })
    const servers = await getServers(await adminHeaders())

    const parsed = z.array(ServerSchema).parse(servers)
    expect(parsed.map((entry) => entry.id)).toContain(provisioningServer.id)
    expect(parsed.find((entry) => entry.id === provisioningServer.id)?.status).toBe("provisioning")
  })

  it("returns servers with status failed", async () => {
    const failedServer = await insertTestServer({ status: "failed" })
    const servers = await getServers(await adminHeaders())

    const parsed = z.array(ServerSchema).parse(servers)
    expect(parsed.map((entry) => entry.id)).toContain(failedServer.id)
    expect(parsed.find((entry) => entry.id === failedServer.id)?.status).toBe("failed")
  })

  it("omits servers with status deleted", async () => {
    const activeServer = await insertTestServer()
    await insertTestServer({ status: "deleted" })
    const servers = await getServers(await adminHeaders())

    expect(servers.map((entry) => entry.id)).toEqual([activeServer.id])
  })

  it("returns a server with an empty endpoints array when it has no endpoints", async () => {
    const listedServer = await insertTestServer()
    const servers = await getServers(await adminHeaders())

    const parsed = z.array(ServerSchema).parse(servers)
    expect(parsed.find((entry) => entry.id === listedServer.id)?.endpoints).toEqual([])
  })

  it("returns a server's endpoints of every status including deleted", async () => {
    const serverProtocol = await insertTestProtocol()
    const listedServer = await insertTestServer()
    const deletedEndpoint = await insertTestEndpoint({
      serverId: listedServer.id,
      protocolId: serverProtocol.id,
      port: 51821,
      status: "deleted",
    })
    const activeEndpoint = await insertTestEndpoint({
      serverId: listedServer.id,
      protocolId: serverProtocol.id,
      port: 51820,
    })
    const servers = await getServers(await adminHeaders())

    const parsed = z.array(ServerSchema).parse(servers)
    const listedServerEndpoints = parsed.find((entry) => entry.id === listedServer.id)?.endpoints
    expect(listedServerEndpoints).toHaveLength(2)
    expect(
      listedServerEndpoints?.find((serverEndpoint) => serverEndpoint.id === activeEndpoint.id)
        ?.status,
    ).toBe("active")
    expect(
      listedServerEndpoints?.find((serverEndpoint) => serverEndpoint.id === deletedEndpoint.id)
        ?.status,
    ).toBe("deleted")
  })

  it("returns a server's endpoints ordered by port ascending", async () => {
    const serverProtocol = await insertTestProtocol()
    const listedServer = await insertTestServer()
    await insertTestEndpoint({
      serverId: listedServer.id,
      protocolId: serverProtocol.id,
      port: 51821,
      status: "deleted",
    })
    await insertTestEndpoint({
      serverId: listedServer.id,
      protocolId: serverProtocol.id,
      port: 51820,
    })
    const servers = await getServers(await adminHeaders())

    const parsed = z.array(ServerSchema).parse(servers)
    const listedServerEndpoints = parsed.find((entry) => entry.id === listedServer.id)?.endpoints
    expect(listedServerEndpoints?.map((serverEndpoint) => serverEndpoint.port)).toEqual([
      51820, 51821,
    ])
  })

  it("returns entries ordered by createdAt descending", async () => {
    const oldestServer = await insertTestServer({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    const newestServer = await insertTestServer({
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
    })
    const middleServer = await insertTestServer({
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
    })
    const servers = await getServers(await adminHeaders())

    expect(servers.map((entry) => entry.id)).toEqual([
      newestServer.id,
      middleServer.id,
      oldestServer.id,
    ])
  })

  it("returns an empty array when no servers exist", async () => {
    const servers = await getServers(await adminHeaders())

    expect(servers).toEqual([])
  })

  it("returns an empty array when every server is deleted", async () => {
    await insertTestServer({ status: "deleted" })
    await insertTestServer({ status: "deleted" })
    const servers = await getServers(await adminHeaders())

    expect(servers).toEqual([])
  })

  it("rejects an ordinary user with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(getServers(headers)).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "FORBIDDEN",
    )
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expect(getServers(new Headers())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the server query throws", async () => {
      vi.mocked(findServers).mockRejectedValueOnce(new Error("Query failure"))

      const response = await app.request("/api/servers", {
        headers: await adminHeaders(),
      })
      expect(response.status).toBe(500)
    })
  })
})
