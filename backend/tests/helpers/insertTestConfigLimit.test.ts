import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/core/database/index.js"
import { configLimit } from "@/core/database/schemas/index.js"
import { insertTestConfigLimit } from "./insertTestConfigLimit.js"
import { insertTestUser } from "./insertTestUser.js"

describe("insertTestConfigLimit", () => {
  it("creates a persisted config limit bound to its user", async () => {
    const limitUser = await insertTestUser()
    const insertedConfigLimit = await insertTestConfigLimit({ userId: limitUser.id })

    expect(insertedConfigLimit.userId).toBe(limitUser.id)
    expect(insertedConfigLimit.protocolFamily).toBe("amneziawg")

    const foundConfigLimits = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.id, insertedConfigLimit.id))
    expect(foundConfigLimits).toHaveLength(1)
  })

  it("applies overrides", async () => {
    const limitUser = await insertTestUser()
    const insertedConfigLimit = await insertTestConfigLimit({ userId: limitUser.id, maxCount: 7 })
    expect(insertedConfigLimit.maxCount).toBe(7)
  })
})
