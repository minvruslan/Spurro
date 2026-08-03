import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { ServerSchema, type UpsertServer } from "@spurro/api-contract"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { serverRouter } from "@/api/modules/server/index.js"
import { updateServer } from "@/api/modules/server/queries/updateServer.js"
import { db } from "@/core/database/index.js"
import { config, endpoint, protocol, server } from "@/core/database/schemas/index.js"
import {
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestUser,
  signInTestUser,
} from "../../../helpers/index.js"

vi.mock("@/api/modules/server/queries/updateServer.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/server/queries/updateServer.js")>()
  return { updateServer: vi.fn(original.updateServer) }
})

const callUpdateServer = (input: unknown, headers: Headers) =>
  call(serverRouter.updateServer, input as UpsertServer & { id: string }, { context: { headers } })

async function adminHeaders() {
  const requestUser = await insertTestUser({ role: "admin" })
  return signInTestUser(requestUser)
}

async function adminJsonHeaders() {
  const headers = await adminHeaders()
  headers.set("content-type", "application/json")
  return headers
}

function createUpdateServerInput(serverId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: serverId,
    name: `Updated Server ${randomUUID()}`,
    ip: "192.0.2.20",
    country: "DE",
    ...overrides,
  }
}

function createUpdateServerInputWithout(
  serverId: string,
  omittedField: keyof ReturnType<typeof createUpdateServerInput>,
) {
  const input: Record<string, unknown> = createUpdateServerInput(serverId)
  delete input[omittedField]
  return input
}

const expectBadRequest = async (input: unknown, headers: Headers) => {
  await expect(callUpdateServer(input, headers)).rejects.toSatisfy(
    (error) => error instanceof ORPCError && error.code === "BAD_REQUEST",
  )
}

describe("PUT /servers/{id}", () => {
  beforeEach(async () => {
    await db.delete(config)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
  })

  it("updates the name and country and returns the server matching the contract schema", async () => {
    const updatedServer = await insertTestServer()
    const input = createUpdateServerInput(updatedServer.id)
    const updateServerResult = await callUpdateServer(input, await adminHeaders())

    const parsed = ServerSchema.parse(updateServerResult)
    expect(parsed.id).toBe(updatedServer.id)
    expect(parsed.name).toBe(input.name)
    expect(parsed.country).toBe(input.country)
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const serverProtocol = await insertTestProtocol()
    const updatedServer = await insertTestServer()
    await insertTestEndpoint({ serverId: updatedServer.id, protocolId: serverProtocol.id })
    const updateServerResult = await callUpdateServer(
      createUpdateServerInput(updatedServer.id),
      await adminHeaders(),
    )

    expect(Object.keys(updateServerResult).sort()).toEqual([
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
    expect(updateServerResult.endpoints).toHaveLength(1)
    for (const serverEndpoint of updateServerResult.endpoints) {
      expect(Object.keys(serverEndpoint).sort()).toEqual(["id", "port", "protocol", "status"])
      expect(Object.keys(serverEndpoint.protocol).sort()).toEqual(["code", "family", "id", "name"])
    }
  })

  it("persists the updated name and country in the database", async () => {
    const updatedServer = await insertTestServer()
    const input = createUpdateServerInput(updatedServer.id)
    await callUpdateServer(input, await adminHeaders())

    const serverRows = await db.select().from(server).where(eq(server.id, updatedServer.id))
    expect(serverRows).toHaveLength(1)
    expect(serverRows[0]?.name).toBe(input.name)
    expect(serverRows[0]?.country).toBe(input.country)
  })

  it("keeps the server status unchanged after an update", async () => {
    const updatedServer = await insertTestServer({ status: "provisioning" })
    const updateServerResult = await callUpdateServer(
      createUpdateServerInput(updatedServer.id),
      await adminHeaders(),
    )

    const parsed = ServerSchema.parse(updateServerResult)
    expect(parsed.status).toBe("provisioning")
    const serverRows = await db.select().from(server).where(eq(server.id, updatedServer.id))
    expect(serverRows[0]?.status).toBe("provisioning")
  })

  it("accepts a payload carrying ip, domainName, endpoints and credentials without rejecting it", async () => {
    const serverProtocol = await insertTestProtocol()
    const updatedServer = await insertTestServer()
    const existingEndpoint = await insertTestEndpoint({
      serverId: updatedServer.id,
      protocolId: serverProtocol.id,
      port: 51820,
    })
    const updateServerResult = await callUpdateServer(
      createUpdateServerInput(updatedServer.id, {
        ip: "192.0.2.90",
        domainName: "updated.example.com",
        endpoints: [{ protocolId: serverProtocol.id, port: 51999 }],
        credentials: { username: "spurro", password: "server-password" },
      }),
      await adminHeaders(),
    )

    ServerSchema.parse(updateServerResult)
    const serverRows = await db.select().from(server).where(eq(server.id, updatedServer.id))
    expect(serverRows[0]?.ip).toBe(updatedServer.ip)
    expect(serverRows[0]?.domainName).toBe(updatedServer.domainName)
    const endpointRows = await db
      .select()
      .from(endpoint)
      .where(eq(endpoint.serverId, updatedServer.id))
    expect(endpointRows).toHaveLength(1)
    expect(endpointRows[0]?.id).toBe(existingEndpoint.id)
    expect(endpointRows[0]?.port).toBe(51820)
  })

  it("does not expose credentials anywhere in the response", async () => {
    const updatedServer = await insertTestServer()
    const username = `user-${randomUUID()}`
    const password = `password-${randomUUID()}`
    const updateServerResult = await callUpdateServer(
      createUpdateServerInput(updatedServer.id, { credentials: { username, password } }),
      await adminHeaders(),
    )

    ServerSchema.parse(updateServerResult)
    const serialized = JSON.stringify(updateServerResult)
    expect(serialized).not.toContain(username)
    expect(serialized).not.toContain(password)
    expect(serialized).not.toContain("credentials")
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    await expect(
      callUpdateServer(createUpdateServerInput(randomUUID()), await adminHeaders()),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "NOT_FOUND")
  })

  it("rejects a soft-deleted server with NOT_FOUND", async () => {
    const deletedServer = await insertTestServer({ status: "deleted" })

    await expect(
      callUpdateServer(createUpdateServerInput(deletedServer.id), await adminHeaders()),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "NOT_FOUND")
  })

  it("rejects a non-uuid id with BAD_REQUEST", async () => {
    await expectBadRequest(createUpdateServerInput("not-a-uuid"), await adminHeaders())
  })

  it("rejects a missing name", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInputWithout(updatedServer.id, "name"),
      await adminHeaders(),
    )
  })

  it("rejects an empty name", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInput(updatedServer.id, { name: "" }),
      await adminHeaders(),
    )
  })

  it("rejects a name longer than 255 characters", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInput(updatedServer.id, { name: "n".repeat(256) }),
      await adminHeaders(),
    )
  })

  it("accepts a name of exactly 255 characters", async () => {
    const updatedServer = await insertTestServer()
    const name = "n".repeat(255)
    const updateServerResult = await callUpdateServer(
      createUpdateServerInput(updatedServer.id, { name }),
      await adminHeaders(),
    )

    const parsed = ServerSchema.parse(updateServerResult)
    expect(parsed.name).toBe(name)
  })

  it("rejects a name of a wrong type", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInput(updatedServer.id, { name: 123 }),
      await adminHeaders(),
    )
  })

  it("rejects a missing ip", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInputWithout(updatedServer.id, "ip"),
      await adminHeaders(),
    )
  })

  it("rejects a malformed ip", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInput(updatedServer.id, { ip: "999.999.999.999" }),
      await adminHeaders(),
    )
  })

  it("rejects a missing country", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInputWithout(updatedServer.id, "country"),
      await adminHeaders(),
    )
  })

  it("rejects a lowercase country code", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInput(updatedServer.id, { country: "de" }),
      await adminHeaders(),
    )
  })

  it("rejects a malformed domainName", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInput(updatedServer.id, { domainName: "not a domain" }),
      await adminHeaders(),
    )
  })

  it("rejects an endpoint with a non-uuid protocolId", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInput(updatedServer.id, {
        endpoints: [{ protocolId: "not-a-uuid", port: 51820 }],
      }),
      await adminHeaders(),
    )
  })

  it("rejects an endpoint with a port of zero", async () => {
    const serverProtocol = await insertTestProtocol()
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInput(updatedServer.id, {
        endpoints: [{ protocolId: serverProtocol.id, port: 0 }],
      }),
      await adminHeaders(),
    )
  })

  it("rejects credentials with an empty password", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInput(updatedServer.id, {
        credentials: { username: "spurro", password: "" },
      }),
      await adminHeaders(),
    )
  })

  it("ignores unknown extra fields in the payload", async () => {
    const updatedServer = await insertTestServer()
    const input = createUpdateServerInput(updatedServer.id, { unknownField: "unknown value" })
    const updateServerResult = await callUpdateServer(input, await adminHeaders())

    const parsed = ServerSchema.parse(updateServerResult)
    expect(parsed.name).toBe(input.name)
    expect(Object.keys(updateServerResult)).not.toContain("unknownField")
  })

  it("does not modify the server row when input validation fails", async () => {
    const updatedServer = await insertTestServer()

    await expectBadRequest(
      createUpdateServerInput(updatedServer.id, { ip: "not-an-ip" }),
      await adminHeaders(),
    )

    const serverRows = await db.select().from(server).where(eq(server.id, updatedServer.id))
    expect(serverRows[0]?.name).toBe(updatedServer.name)
    expect(serverRows[0]?.country).toBe(updatedServer.country)
  })

  it("rejects an ordinary user with FORBIDDEN", async () => {
    const updatedServer = await insertTestServer()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(
      callUpdateServer(createUpdateServerInput(updatedServer.id), headers),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "FORBIDDEN")
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    const updatedServer = await insertTestServer()

    await expect(
      callUpdateServer(createUpdateServerInput(updatedServer.id), new Headers()),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "UNAUTHORIZED")
  })

  it("does not modify the server row when the requester is not an admin", async () => {
    const updatedServer = await insertTestServer()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(
      callUpdateServer(createUpdateServerInput(updatedServer.id), headers),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "FORBIDDEN")

    const serverRows = await db.select().from(server).where(eq(server.id, updatedServer.id))
    expect(serverRows[0]?.name).toBe(updatedServer.name)
    expect(serverRows[0]?.country).toBe(updatedServer.country)
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the server update throws", async () => {
      const updatedServer = await insertTestServer()
      vi.mocked(updateServer).mockRejectedValueOnce(new Error("Update failure"))

      const response = await app.request(`/api/servers/${updatedServer.id}`, {
        method: "PUT",
        headers: await adminJsonHeaders(),
        body: JSON.stringify(createUpdateServerInput(updatedServer.id)),
      })

      expect(response.status).toBe(500)
    })
  })
})
