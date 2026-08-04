import { ProtocolRegistry } from "@spurro/infrastructure/types"
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { bootstrapProtocols } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { protocol } from "@/core/database/schemas/index.js"

describe("bootstrapProtocols", () => {
  it("seeds one enabled protocol per registry entry", async () => {
    await bootstrapProtocols()

    const protocolRows = await db.select().from(protocol)
    expect(protocolRows.map((row) => row.code).sort()).toEqual(Object.keys(ProtocolRegistry).sort())
    expect(protocolRows.every((row) => row.isEnabled)).toBe(true)
  })

  it("seeds the family and name declared by the registry", async () => {
    await bootstrapProtocols()

    const protocolRows = await db.select().from(protocol)
    expect(protocolRows).toHaveLength(Object.keys(ProtocolRegistry).length)
    for (const protocolRow of protocolRows) {
      const registryEntry = ProtocolRegistry[protocolRow.code as keyof typeof ProtocolRegistry]
      expect(protocolRow.family).toBe(registryEntry.family)
      expect(protocolRow.name).toBe(registryEntry.name)
    }
  })

  it("inserts nothing on a second run", async () => {
    await bootstrapProtocols()
    const seededRows = await db.select().from(protocol)

    await bootstrapProtocols()

    const protocolRows = await db.select().from(protocol)
    expect(protocolRows.map((row) => row.id).sort()).toEqual(seededRows.map((row) => row.id).sort())
  })

  it("leaves a row whose name diverges from the registry unchanged", async () => {
    await bootstrapProtocols()
    const [seededProtocol] = await db.select().from(protocol).limit(1)
    await db.update(protocol).set({ name: "Stale Name" }).where(eq(protocol.id, seededProtocol.id))
    const [staleProtocol] = await db
      .select()
      .from(protocol)
      .where(eq(protocol.id, seededProtocol.id))

    await bootstrapProtocols()

    const protocolRows = await db.select().from(protocol).where(eq(protocol.id, seededProtocol.id))
    expect(protocolRows).toEqual([staleProtocol])
  })

  it("keeps a protocol disabled by an operator on a later run", async () => {
    await bootstrapProtocols()
    const [disabledProtocol] = await db.select().from(protocol).limit(1)
    await db.update(protocol).set({ isEnabled: false }).where(eq(protocol.id, disabledProtocol.id))

    await bootstrapProtocols()

    const protocolRows = await db.select().from(protocol)
    const disabledRows = protocolRows.filter((row) => row.isEnabled === false)
    expect(disabledRows.map((row) => row.id)).toEqual([disabledProtocol.id])
  })
})
