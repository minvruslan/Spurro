import { beforeEach, describe, expect, it } from "vitest"
import { db } from "@/core/database/index.js"
import { endpoint, protocol } from "@/core/database/schemas/index.js"
import { insertTestProtocol } from "./insertTestProtocol.js"

describe("insertTestProtocol", () => {
  beforeEach(async () => {
    await db.delete(endpoint)
    await db.delete(protocol)
  })

  it("creates a persisted protocol with registry defaults", async () => {
    const insertedProtocol = await insertTestProtocol()
    expect(insertedProtocol.id).toBeDefined()
    expect(insertedProtocol.code).toBe("amneziawg2")
    expect(insertedProtocol.family).toBe("amneziawg")
  })
})
