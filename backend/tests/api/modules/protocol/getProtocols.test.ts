import { call, ORPCError } from "@orpc/server"
import { ProtocolSchema, type Protocol } from "@spurro/api-contract"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { protocolRouter } from "@/api/modules/protocol/index.js"
import { findActiveProtocols } from "@/api/modules/protocol/queries/findActiveProtocols.js"
import { bootstrapProtocols } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { endpoint, protocol } from "@/core/database/schemas/index.js"
import {
  insertTestProtocol,
  insertTestServer,
  insertTestUser,
  signInTestUser,
} from "../../../helpers/index.js"

vi.mock("@/api/modules/protocol/queries/findActiveProtocols.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/api/modules/protocol/queries/findActiveProtocols.js")>()
  return { findActiveProtocols: vi.fn(original.findActiveProtocols) }
})

const getProtocols = (headers: Headers) =>
  call(protocolRouter.getProtocols, undefined, { context: { headers } })

async function adminHeaders() {
  const requestUser = await insertTestUser({ role: "admin" })
  return signInTestUser(requestUser)
}

describe("GET /protocols", () => {
  beforeEach(async () => {
    await db.delete(endpoint)
    await db.delete(protocol)
  })

  it("returns the enabled protocol catalog matching the contract schema", async () => {
    await bootstrapProtocols()
    const protocols = await getProtocols(await adminHeaders())

    const parsed = z.array(ProtocolSchema).parse(protocols)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].code).toBe("amneziawg2")
  })

  it("exposes exactly the contract fields and nothing more", async () => {
    await bootstrapProtocols()
    const protocols = await getProtocols(await adminHeaders())

    expect(protocols).toHaveLength(1)
    for (const entry of protocols) {
      expect(Object.keys(entry).sort()).toEqual(["code", "family", "id", "name"])
    }
  })

  it("returns each protocol with the family matching its code", async () => {
    const expectedFamiliesByCode: Record<Protocol["code"], Protocol["family"]> = {
      amneziawg2: "amneziawg",
    }
    await bootstrapProtocols()
    const protocols = await getProtocols(await adminHeaders())

    expect(protocols).toHaveLength(1)
    for (const entry of protocols) {
      expect(entry.family).toBe(expectedFamiliesByCode[entry.code])
    }
  })

  it("omits disabled protocols", async () => {
    const disabledProtocol = await insertTestProtocol({ isEnabled: false })
    const protocols = await getProtocols(await adminHeaders())

    expect(protocols.map((entry) => entry.code)).not.toContain(disabledProtocol.code)
  })

  it("keeps a disabled protocol hidden even when it has active endpoints", async () => {
    const disabledProtocol = await insertTestProtocol({ isEnabled: false })
    const endpointServer = await insertTestServer()
    await db.insert(endpoint).values({
      serverId: endpointServer.id,
      protocolId: disabledProtocol.id,
      port: 51820,
      data: {},
      status: "active",
    })
    const protocols = await getProtocols(await adminHeaders())

    expect(protocols.map((entry) => entry.code)).not.toContain(disabledProtocol.code)
  })

  it("returns an empty array when all protocols are disabled", async () => {
    await insertTestProtocol({ isEnabled: false })
    const protocols = await getProtocols(await adminHeaders())

    expect(protocols).toEqual([])
  })

  it("returns an empty array when no protocols exist", async () => {
    const protocols = await getProtocols(await adminHeaders())

    expect(protocols).toEqual([])
  })

  it("rejects an ordinary user with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(getProtocols(headers)).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "FORBIDDEN",
    )
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expect(getProtocols(new Headers())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the protocol query throws", async () => {
      vi.mocked(findActiveProtocols).mockRejectedValueOnce(new Error("Query failure"))

      const response = await app.request("/api/protocols", {
        headers: await adminHeaders(),
      })
      expect(response.status).toBe(500)
    })
  })
})
