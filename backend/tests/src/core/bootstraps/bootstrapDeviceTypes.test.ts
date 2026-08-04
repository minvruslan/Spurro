import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schemas/index.js"

describe("bootstrapDeviceTypes", () => {
  it("seeds enabled device types with unique codes", async () => {
    await bootstrapDeviceTypes()

    const deviceTypeRows = await db.select().from(deviceType)
    expect(deviceTypeRows.length).toBeGreaterThan(0)
    expect(new Set(deviceTypeRows.map((row) => row.code)).size).toBe(deviceTypeRows.length)
    expect(deviceTypeRows.every((row) => row.isEnabled)).toBe(true)
  })

  it("inserts nothing on a second run", async () => {
    await bootstrapDeviceTypes()
    const seededRows = await db.select().from(deviceType)

    await bootstrapDeviceTypes()

    const deviceTypeRows = await db.select().from(deviceType)
    expect(deviceTypeRows.map((row) => row.id).sort()).toEqual(
      seededRows.map((row) => row.id).sort(),
    )
  })

  it("adds the missing device types to a partially seeded catalog keeping existing rows", async () => {
    await db.insert(deviceType).values({ code: "ios", name: "iOS" })
    const [existingDeviceType] = await db.select().from(deviceType)

    await bootstrapDeviceTypes()

    const deviceTypeRows = await db.select().from(deviceType)
    expect(deviceTypeRows.map((row) => row.code).sort()).toEqual([
      "android",
      "ios",
      "linux",
      "macos",
      "windows",
    ])
    const existingRows = deviceTypeRows.filter((row) => row.code === "ios")
    expect(existingRows).toEqual([existingDeviceType])
  })

  it("leaves a row whose name diverges from the catalog unchanged", async () => {
    await bootstrapDeviceTypes()
    const [seededDeviceType] = await db
      .select()
      .from(deviceType)
      .where(eq(deviceType.code, "ios"))
    await db
      .update(deviceType)
      .set({ name: "Android" })
      .where(eq(deviceType.id, seededDeviceType.id))
    const [staleDeviceType] = await db
      .select()
      .from(deviceType)
      .where(eq(deviceType.id, seededDeviceType.id))

    await bootstrapDeviceTypes()

    const deviceTypeRows = await db
      .select()
      .from(deviceType)
      .where(eq(deviceType.id, seededDeviceType.id))
    expect(deviceTypeRows).toEqual([staleDeviceType])
  })

  it("keeps a device type disabled by an operator on a later run", async () => {
    await bootstrapDeviceTypes()
    const [disabledDeviceType] = await db.select().from(deviceType).limit(1)
    await db
      .update(deviceType)
      .set({ isEnabled: false })
      .where(eq(deviceType.id, disabledDeviceType.id))

    await bootstrapDeviceTypes()

    const deviceTypeRows = await db.select().from(deviceType)
    const disabledRows = deviceTypeRows.filter((row) => row.isEnabled === false)
    expect(disabledRows.map((row) => row.id)).toEqual([disabledDeviceType.id])
    expect(deviceTypeRows.length).toBeGreaterThan(1)
  })
})
