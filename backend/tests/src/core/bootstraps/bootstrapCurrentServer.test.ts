import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { bootstrapCurrentServer } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/index.js"
import { env } from "@/core/env/index.js"
import { insertTestServer } from "@tests/helpers/index.js"

const TEST_ENVIRONMENT_IP = "127.0.0.1"
const TEST_ENVIRONMENT_COUNTRY = "NL"

describe("bootstrapCurrentServer", () => {
  it("creates the current server from the environment", async () => {
    await bootstrapCurrentServer()

    const serverRows = await db.select().from(server).where(eq(server.isCurrent, true))
    expect(serverRows).toHaveLength(1)
    expect(serverRows[0].name).toBe("Current")
    expect(serverRows[0].ip).toBe(TEST_ENVIRONMENT_IP)
    expect(serverRows[0].country).toBe(TEST_ENVIRONMENT_COUNTRY)
    expect(serverRows[0].status).toBe("active")
  })

  it("stores a null domainName when DOMAIN_NAME is unset", async () => {
    expect(env.DOMAIN_NAME).toBeUndefined()

    await bootstrapCurrentServer()

    const [currentServer] = await db.select().from(server).where(eq(server.isCurrent, true))
    expect(currentServer.domainName).toBeNull()
  })

  it("stores the domain name when DOMAIN_NAME is set", async () => {
    env.DOMAIN_NAME = "current.spurro.test"
    try {
      await bootstrapCurrentServer()

      const [currentServer] = await db.select().from(server).where(eq(server.isCurrent, true))
      expect(currentServer.domainName).toBe("current.spurro.test")
    } finally {
      delete env.DOMAIN_NAME
    }
  })

  it("creates no second current server when run twice", async () => {
    await bootstrapCurrentServer()
    const [createdServer] = await db.select().from(server).where(eq(server.isCurrent, true))

    await bootstrapCurrentServer()

    const serverRows = await db.select().from(server)
    expect(serverRows).toHaveLength(1)
    expect(serverRows[0].id).toBe(createdServer.id)
  })

  it("leaves an existing current server unchanged", async () => {
    const existingServer = await insertTestServer({ isCurrent: true, name: "Existing" })

    await bootstrapCurrentServer()

    const serverRows = await db.select().from(server).where(eq(server.isCurrent, true))
    expect(serverRows).toEqual([existingServer])
  })

  it("creates the current server alongside unrelated servers", async () => {
    const unrelatedServer = await insertTestServer()

    await bootstrapCurrentServer()

    const serverRows = await db.select().from(server)
    expect(serverRows).toHaveLength(2)
    const unrelatedServerRows = await db
      .select()
      .from(server)
      .where(eq(server.id, unrelatedServer.id))
    expect(unrelatedServerRows[0].isCurrent).toBe(false)
  })
})
