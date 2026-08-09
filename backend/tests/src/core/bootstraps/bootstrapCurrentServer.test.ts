import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { bootstrapCurrentServer } from "@/core/bootstraps/bootstrapCurrentServer.js"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/index.js"
import { env } from "@/core/env/index.js"
import { insertTestServer } from "@tests/helpers/index.js"

describe("bootstrapCurrentServer", () => {
  it("creates the current server from the environment", async () => {
    await bootstrapCurrentServer()

    const serverRows = await db.select().from(server).where(eq(server.isCurrent, true))
    expect(serverRows).toHaveLength(1)
    expect(serverRows[0].name).toBe("Current")
    expect(serverRows[0].ip).toBe(env.IP)
    expect(serverRows[0].country).toBe(env.COUNTRY)
    expect(serverRows[0].status).toBe("active")
  })

  it("stores the ip and country set in the environment", async () => {
    const originalIp = env.IP
    const originalCountry = env.COUNTRY
    env.IP = "203.0.113.7"
    env.COUNTRY = "DE"

    try {
      await bootstrapCurrentServer()

      const [currentServer] = await db.select().from(server).where(eq(server.isCurrent, true))
      expect(currentServer.ip).toBe("203.0.113.7")
      expect(currentServer.country).toBe("DE")
    } finally {
      env.IP = originalIp
      env.COUNTRY = originalCountry
    }
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

  it("creates no second current server and touches nothing when run twice", async () => {
    await bootstrapCurrentServer()
    const [createdServer] = await db.select().from(server).where(eq(server.isCurrent, true))

    await bootstrapCurrentServer()

    const serverRows = await db.select().from(server)
    expect(serverRows).toEqual([createdServer])
  })

  it("updates the ip of an existing current server from the environment", async () => {
    await insertTestServer({
      isCurrent: true,
      name: "Existing",
      ip: "192.0.2.1",
      country: env.COUNTRY,
    })

    await bootstrapCurrentServer()

    const [currentServer] = await db.select().from(server).where(eq(server.isCurrent, true))
    expect(currentServer.ip).toBe(env.IP)
    expect(currentServer.name).toBe("Existing")
  })

  it("updates the country of an existing current server from the environment", async () => {
    await insertTestServer({ isCurrent: true, ip: env.IP, country: "DE" })

    await bootstrapCurrentServer()

    const [currentServer] = await db.select().from(server).where(eq(server.isCurrent, true))
    expect(currentServer.country).toBe(env.COUNTRY)
  })

  it("updates the domain name of an existing current server from the environment", async () => {
    await insertTestServer({
      isCurrent: true,
      ip: env.IP,
      country: env.COUNTRY,
      domainName: "old.spurro.test",
    })
    env.DOMAIN_NAME = "current.spurro.test"

    try {
      await bootstrapCurrentServer()

      const [currentServer] = await db.select().from(server).where(eq(server.isCurrent, true))
      expect(currentServer.domainName).toBe("current.spurro.test")
    } finally {
      delete env.DOMAIN_NAME
    }
  })

  it("leaves an existing current server untouched when its address matches the environment", async () => {
    const existingServer = await insertTestServer({
      isCurrent: true,
      ip: env.IP,
      country: env.COUNTRY,
    })

    await bootstrapCurrentServer()

    const serverRows = await db.select().from(server)
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
