import { randomUUID } from "node:crypto"
import { call } from "@orpc/server"
import { type Protocol, ServerSchema, type UpsertServer } from "@spurro/api-contract"
import { ProtocolRegistry, ServerDataSchema } from "@spurro/infrastructure/types"
import { eq, sql } from "drizzle-orm"
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { serverRouter } from "@/api/modules/server/index.js"
import { deleteServer } from "@/api/modules/server/queries/deleteServer.js"
import { insertServer } from "@/api/modules/server/queries/insertServer.js"
import { db } from "@/core/database/index.js"
import { endpoint, server } from "@/core/database/schemas/index.js"
import {
  PROVISION_SERVER_JOB_NAME,
  provisionServerQueue,
} from "@/core/queue/provision-server/index.js"
import { expectOrpcError } from "../../../assertions/index.js"
import {
  insertTestProtocol,
  insertTestSession,
  insertTestUser,
  signInTestAdmin,
} from "../../../helpers/index.js"

vi.mock("@/core/queue/provision-server/index.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/core/queue/provision-server/index.js")>()
  return { ...original, provisionServerQueue: vi.fn(original.provisionServerQueue) }
})

vi.mock("@/api/modules/server/queries/insertServer.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/server/queries/insertServer.js")>()
  return { insertServer: vi.fn(original.insertServer) }
})

vi.mock("@/api/modules/server/queries/deleteServer.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/server/queries/deleteServer.js")>()
  return { deleteServer: vi.fn(original.deleteServer) }
})

function callCreateServer(input: unknown, headers: Headers) {
  return call(serverRouter.createServer, input as UpsertServer, { context: { headers } })
}

async function adminJsonHeaders() {
  const headers = await signInTestAdmin()
  headers.set("content-type", "application/json")
  return headers
}

function createServerInput(overrides: Record<string, unknown> = {}) {
  return {
    name: `Created Server ${randomUUID()}`,
    ip: "192.0.2.10",
    country: "NL",
    credentials: { username: "spurro", password: "server-password" },
    ...overrides,
  }
}

function createServerInputWithout(omittedField: keyof ReturnType<typeof createServerInput>) {
  const input: Record<string, unknown> = createServerInput()
  delete input[omittedField]
  return input
}

function createUnavailableQueue() {
  return {
    add: vi.fn().mockRejectedValue(new Error("Queue unavailable")),
  } as unknown as ReturnType<typeof provisionServerQueue>
}

const realProvisionServerQueue = provisionServerQueue()

describe("POST /servers", () => {
  beforeEach(async () => {
    await realProvisionServerQueue.obliterate({ force: true })
  })

  afterAll(async () => {
    await realProvisionServerQueue.obliterate({ force: true })
    await realProvisionServerQueue.close()
  })

  it("creates a server and returns it matching the contract schema with status 201", async () => {
    const input = createServerInput()

    const response = await app.request("/api/servers", {
      method: "POST",
      headers: await adminJsonHeaders(),
      body: JSON.stringify(input),
    })

    expect(response.status).toBe(201)
    const parsed = ServerSchema.parse(await response.json())
    expect(parsed.name).toBe(input.name)
    expect(parsed.ip).toBe(input.ip)
    expect(parsed.country).toBe(input.country)
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const serverProtocol = await insertTestProtocol()
    const createdServer = await callCreateServer(
      createServerInput({ endpoints: [{ protocolId: serverProtocol.id, port: 51820 }] }),
      await signInTestAdmin(),
    )

    expect(Object.keys(createdServer).sort()).toEqual([
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
    expect(createdServer.endpoints).toHaveLength(1)
    for (const serverEndpoint of createdServer.endpoints) {
      expect(Object.keys(serverEndpoint).sort()).toEqual(["id", "port", "protocol", "status"])
      expect(Object.keys(serverEndpoint.protocol).sort()).toEqual(["code", "family", "id", "name"])
    }
  })

  it("returns the created server with status provisioning and isCurrent false", async () => {
    const createdServer = await callCreateServer(createServerInput(), await signInTestAdmin())

    const parsed = ServerSchema.parse(createdServer)
    expect(parsed.status).toBe("provisioning")
    expect(parsed.isCurrent).toBe(false)
  })

  it("returns the created server endpoint protocol with the family matching its code", async () => {
    const expectedFamiliesByCode: Record<Protocol["code"], Protocol["family"]> = {
      amneziawg2: "amneziawg",
    }
    const serverProtocol = await insertTestProtocol()
    const createdServer = await callCreateServer(
      createServerInput({ endpoints: [{ protocolId: serverProtocol.id, port: 51820 }] }),
      await signInTestAdmin(),
    )

    const parsed = ServerSchema.parse(createdServer)
    expect(parsed.endpoints).toHaveLength(1)
    for (const serverEndpoint of parsed.endpoints) {
      expect(serverEndpoint.protocol.family).toBe(
        expectedFamiliesByCode[serverEndpoint.protocol.code],
      )
    }
  })

  it("does not expose credentials anywhere in the response", async () => {
    const username = `user-${randomUUID()}`
    const password = `password-${randomUUID()}`
    const createdServer = await callCreateServer(
      createServerInput({ credentials: { username, password } }),
      await signInTestAdmin(),
    )

    ServerSchema.parse(createdServer)
    const serialized = JSON.stringify(createdServer)
    expect(serialized).not.toContain(username)
    expect(serialized).not.toContain(password)
    expect(serialized).not.toContain("credentials")
  })

  it("persists the server row with status provisioning in the database", async () => {
    const createdServer = await callCreateServer(createServerInput(), await signInTestAdmin())

    const serverRows = await db.select().from(server).where(eq(server.id, createdServer.id))
    expect(serverRows).toHaveLength(1)
    expect(serverRows[0]?.status).toBe("provisioning")
    expect(serverRows[0]?.name).toBe(createdServer.name)
  })

  it("persists the ssh credentials into the server data column", async () => {
    const username = `user-${randomUUID()}`
    const password = `password-${randomUUID()}`
    const createdServer = await callCreateServer(
      createServerInput({ credentials: { username, password } }),
      await signInTestAdmin(),
    )

    const serverRows = await db.select().from(server).where(eq(server.id, createdServer.id))
    expect(serverRows).toHaveLength(1)
    const persistedServerData = ServerDataSchema.parse(serverRows[0]?.data)
    expect(persistedServerData.actualState.ssh).toEqual({
      type: "password",
      username,
      password,
      port: 22,
    })
  })

  it("stores the ip and data columns encrypted at rest", async () => {
    const ip = "198.51.100.7"
    const password = `password-${randomUUID()}`
    const createdServer = await callCreateServer(
      createServerInput({ ip, credentials: { username: "spurro", password } }),
      await signInTestAdmin(),
    )

    const rawServerRows = await db.execute<{ ip: string; data: string }>(
      sql`select ip, data::text as data from server where id = ${createdServer.id}::uuid`,
    )
    expect(rawServerRows).toHaveLength(1)
    for (const rawColumnValue of [rawServerRows[0]?.ip, rawServerRows[0]?.data]) {
      expect(rawColumnValue?.startsWith("v1:")).toBe(true)
      expect(rawColumnValue).not.toContain(ip)
      expect(rawColumnValue).not.toContain(password)
    }
  })

  it("persists an endpoint row for each provided endpoint with its port", async () => {
    const serverProtocol = await insertTestProtocol()
    const createdServer = await callCreateServer(
      createServerInput({ endpoints: [{ protocolId: serverProtocol.id, port: 51821 }] }),
      await signInTestAdmin(),
    )

    const endpointRows = await db
      .select()
      .from(endpoint)
      .where(eq(endpoint.serverId, createdServer.id))
    expect(endpointRows).toHaveLength(1)
    expect(endpointRows[0]?.port).toBe(51821)
    expect(endpointRows[0]?.protocolId).toBe(serverProtocol.id)
  })

  it("uses the protocol registry default port when the endpoint port is omitted", async () => {
    const serverProtocol = await insertTestProtocol()
    const createdServer = await callCreateServer(
      createServerInput({ endpoints: [{ protocolId: serverProtocol.id }] }),
      await signInTestAdmin(),
    )

    const parsed = ServerSchema.parse(createdServer)
    expect(parsed.endpoints).toHaveLength(1)
    expect(parsed.endpoints[0]?.port).toBe(ProtocolRegistry.amneziawg2.defaultPort)
  })

  it("creates a server with an empty endpoints array when endpoints are omitted", async () => {
    const createdServer = await callCreateServer(createServerInput(), await signInTestAdmin())

    const parsed = ServerSchema.parse(createdServer)
    expect(parsed.endpoints).toEqual([])
  })

  it("creates a server with an empty endpoints array when endpoints is an empty array", async () => {
    const createdServer = await callCreateServer(
      createServerInput({ endpoints: [] }),
      await signInTestAdmin(),
    )

    const parsed = ServerSchema.parse(createdServer)
    expect(parsed.endpoints).toEqual([])
  })

  it("returns a null domainName when domainName is omitted", async () => {
    const createdServer = await callCreateServer(createServerInput(), await signInTestAdmin())

    const parsed = ServerSchema.parse(createdServer)
    expect(parsed.domainName).toBeNull()
  })

  it("persists a provided domainName and returns it", async () => {
    const domainName = `node-${randomUUID()}.spurro.test`
    const createdServer = await callCreateServer(
      createServerInput({ domainName }),
      await signInTestAdmin(),
    )

    const parsed = ServerSchema.parse(createdServer)
    expect(parsed.domainName).toBe(domainName)
    const serverRows = await db.select().from(server).where(eq(server.id, createdServer.id))
    expect(serverRows).toHaveLength(1)
    expect(serverRows[0]?.domainName).toBe(domainName)
  })

  it("enqueues a provision-server job with jobId equal to the created server id and data carrying the serverId", async () => {
    const createdServer = await callCreateServer(createServerInput(), await signInTestAdmin())

    const provisionServerJob = await provisionServerQueue().getJob(createdServer.id)
    expect(provisionServerJob).toBeDefined()
    expect(provisionServerJob?.name).toBe(PROVISION_SERVER_JOB_NAME)
    expect(provisionServerJob?.data).toEqual({ serverId: createdServer.id })
  })

  it("rejects a payload without credentials with CREDENTIALS_REQUIRED", async () => {
    await expectOrpcError(
      callCreateServer(createServerInputWithout("credentials"), await signInTestAdmin()),
      "CREDENTIALS_REQUIRED",
    )
  })

  it("rejects an endpoint with an unknown protocolId with PROTOCOL_NOT_FOUND", async () => {
    await insertTestProtocol()

    await expectOrpcError(
      callCreateServer(
        createServerInput({ endpoints: [{ protocolId: randomUUID(), port: 51820 }] }),
        await signInTestAdmin(),
      ),
      "PROTOCOL_NOT_FOUND",
    )
  })

  it("rejects two endpoints with the same protocol with DUPLICATE_PROTOCOL", async () => {
    const serverProtocol = await insertTestProtocol()

    await expectOrpcError(
      callCreateServer(
        createServerInput({
          endpoints: [
            { protocolId: serverProtocol.id, port: 51820 },
            { protocolId: serverProtocol.id, port: 51821 },
          ],
        }),
        await signInTestAdmin(),
      ),
      "DUPLICATE_PROTOCOL",
    )
  })

  it("rejects with ENQUEUE_FAILED and HTTP 502 when the queue is unavailable", async () => {
    vi.mocked(provisionServerQueue).mockReturnValueOnce(createUnavailableQueue())

    const response = await app.request("/api/servers", {
      method: "POST",
      headers: await adminJsonHeaders(),
      body: JSON.stringify(createServerInput()),
    })

    expect(response.status).toBe(502)
    expect(await response.json()).toMatchObject({ code: "ENQUEUE_FAILED" })
  })

  it("responds with HTTP 400 when credentials are missing", async () => {
    const response = await app.request("/api/servers", {
      method: "POST",
      headers: await adminJsonHeaders(),
      body: JSON.stringify(createServerInputWithout("credentials")),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: "CREDENTIALS_REQUIRED" })
  })

  it("responds with HTTP 409 for two endpoints with the same protocol", async () => {
    const serverProtocol = await insertTestProtocol()

    const response = await app.request("/api/servers", {
      method: "POST",
      headers: await adminJsonHeaders(),
      body: JSON.stringify(
        createServerInput({
          endpoints: [
            { protocolId: serverProtocol.id, port: 51820 },
            { protocolId: serverProtocol.id, port: 51821 },
          ],
        }),
      ),
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: "DUPLICATE_PROTOCOL" })
  })

  it("responds with HTTP 400 for an unknown protocolId", async () => {
    await insertTestProtocol()

    const response = await app.request("/api/servers", {
      method: "POST",
      headers: await adminJsonHeaders(),
      body: JSON.stringify(
        createServerInput({ endpoints: [{ protocolId: randomUUID(), port: 51820 }] }),
      ),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: "PROTOCOL_NOT_FOUND" })
  })

  it("deletes the created server row when the enqueue fails", async () => {
    vi.mocked(provisionServerQueue).mockReturnValueOnce(createUnavailableQueue())

    await expectOrpcError(
      callCreateServer(createServerInput(), await signInTestAdmin()),
      "ENQUEUE_FAILED",
    )

    const serverRows = await db.select().from(server)
    expect(serverRows).toHaveLength(0)
  })

  it("does not insert server or endpoint rows when a business error rejects the create", async () => {
    await insertTestProtocol()

    await expectOrpcError(
      callCreateServer(
        createServerInput({ endpoints: [{ protocolId: randomUUID(), port: 51820 }] }),
        await signInTestAdmin(),
      ),
      "PROTOCOL_NOT_FOUND",
    )

    expect(await db.select().from(server)).toHaveLength(0)
    expect(await db.select().from(endpoint)).toHaveLength(0)
  })

  it("does not insert server or endpoint rows when input validation fails", async () => {
    const serverProtocol = await insertTestProtocol()

    await expectOrpcError(
      callCreateServer(
        createServerInput({
          ip: "not-an-ip",
          endpoints: [{ protocolId: serverProtocol.id, port: 51820 }],
        }),
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )

    expect(await db.select().from(server)).toHaveLength(0)
    expect(await db.select().from(endpoint)).toHaveLength(0)
  })

  it("does not enqueue a job when a business error rejects the create", async () => {
    await expectOrpcError(
      callCreateServer(createServerInputWithout("credentials"), await signInTestAdmin()),
      "CREDENTIALS_REQUIRED",
    )

    expect(await provisionServerQueue().getJobs()).toHaveLength(0)
  })

  it("does not enqueue a job when input validation fails", async () => {
    await expectOrpcError(
      callCreateServer(createServerInput({ ip: "not-an-ip" }), await signInTestAdmin()),
      "BAD_REQUEST",
    )

    expect(await provisionServerQueue().getJobs()).toHaveLength(0)
  })

  it("rejects a missing name", async () => {
    await expectOrpcError(
      callCreateServer(createServerInputWithout("name"), await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects an empty name", async () => {
    await expectOrpcError(
      callCreateServer(createServerInput({ name: "" }), await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects a name longer than 255 characters", async () => {
    await expectOrpcError(
      callCreateServer(createServerInput({ name: "n".repeat(256) }), await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("accepts a name of exactly 255 characters", async () => {
    const name = "n".repeat(255)
    const createdServer = await callCreateServer(
      createServerInput({ name }),
      await signInTestAdmin(),
    )

    const parsed = ServerSchema.parse(createdServer)
    expect(parsed.name).toBe(name)
  })

  it("rejects a name of a wrong type", async () => {
    await expectOrpcError(
      callCreateServer(createServerInput({ name: 123 }), await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects a missing ip", async () => {
    await expectOrpcError(
      callCreateServer(createServerInputWithout("ip"), await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects a malformed ip", async () => {
    await expectOrpcError(
      callCreateServer(createServerInput({ ip: "999.999.999.999" }), await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects a missing country", async () => {
    await expectOrpcError(
      callCreateServer(createServerInputWithout("country"), await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects a lowercase country code", async () => {
    await expectOrpcError(
      callCreateServer(createServerInput({ country: "nl" }), await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects a country code longer than two letters", async () => {
    await expectOrpcError(
      callCreateServer(createServerInput({ country: "NLD" }), await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects a malformed domainName", async () => {
    await expectOrpcError(
      callCreateServer(createServerInput({ domainName: "not a domain" }), await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects an endpoint with a non-uuid protocolId", async () => {
    await expectOrpcError(
      callCreateServer(
        createServerInput({ endpoints: [{ protocolId: "not-a-uuid", port: 51820 }] }),
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects an endpoint with a port of zero", async () => {
    const serverProtocol = await insertTestProtocol()

    await expectOrpcError(
      callCreateServer(
        createServerInput({ endpoints: [{ protocolId: serverProtocol.id, port: 0 }] }),
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects an endpoint with a negative port", async () => {
    const serverProtocol = await insertTestProtocol()

    await expectOrpcError(
      callCreateServer(
        createServerInput({ endpoints: [{ protocolId: serverProtocol.id, port: -1 }] }),
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects an endpoint with a non-integer port", async () => {
    const serverProtocol = await insertTestProtocol()

    await expectOrpcError(
      callCreateServer(
        createServerInput({ endpoints: [{ protocolId: serverProtocol.id, port: 51820.5 }] }),
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects an endpoint with a port above 65535", async () => {
    const serverProtocol = await insertTestProtocol()

    await expectOrpcError(
      callCreateServer(
        createServerInput({ endpoints: [{ protocolId: serverProtocol.id, port: 65536 }] }),
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("accepts an endpoint with a port of exactly 65535", async () => {
    const serverProtocol = await insertTestProtocol()
    const createdServer = await callCreateServer(
      createServerInput({ endpoints: [{ protocolId: serverProtocol.id, port: 65535 }] }),
      await signInTestAdmin(),
    )

    const parsed = ServerSchema.parse(createdServer)
    expect(parsed.endpoints).toHaveLength(1)
    expect(parsed.endpoints[0]?.port).toBe(65535)
  })

  it("rejects credentials with an empty password", async () => {
    await expectOrpcError(
      callCreateServer(
        createServerInput({ credentials: { username: "spurro", password: "" } }),
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects credentials missing the password field", async () => {
    await expectOrpcError(
      callCreateServer(
        createServerInput({ credentials: { username: "spurro" } }),
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects credentials with a malformed unix username", async () => {
    await expectOrpcError(
      callCreateServer(
        createServerInput({ credentials: { username: "1invalid", password: "server-password" } }),
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("ignores unknown extra fields in the payload", async () => {
    const createdServer = await callCreateServer(
      createServerInput({ unknownField: "unknown value" }),
      await signInTestAdmin(),
    )

    const parsed = ServerSchema.parse(createdServer)
    expect(parsed.endpoints).toEqual([])
    expect(Object.keys(createdServer)).not.toContain("unknownField")
  })

  it("rejects an ordinary user with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(callCreateServer(createServerInput(), headers), "FORBIDDEN")
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expectOrpcError(callCreateServer(createServerInput(), new Headers()), "UNAUTHORIZED")
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the server insert throws", async () => {
      vi.mocked(insertServer).mockRejectedValueOnce(new Error("Insert failure"))

      const response = await app.request("/api/servers", {
        method: "POST",
        headers: await adminJsonHeaders(),
        body: JSON.stringify(createServerInput()),
      })

      expect(response.status).toBe(500)
    })

    it("does not enqueue a job when the server insert throws", async () => {
      vi.mocked(insertServer).mockRejectedValueOnce(new Error("Insert failure"))

      await expect(callCreateServer(createServerInput(), await signInTestAdmin())).rejects.toThrow()

      expect(await provisionServerQueue().getJobs()).toHaveLength(0)
    })

    it("responds with ENQUEUE_FAILED when the enqueue fails and the rollback delete also throws", async () => {
      vi.mocked(provisionServerQueue).mockReturnValueOnce(createUnavailableQueue())
      vi.mocked(deleteServer).mockRejectedValueOnce(new Error("Delete failure"))

      await expectOrpcError(
        callCreateServer(createServerInput(), await signInTestAdmin()),
        "ENQUEUE_FAILED",
      )

      expect(await db.select().from(server)).toHaveLength(1)
    })
  })
})
