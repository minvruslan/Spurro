import { describe, expect, it } from "vitest"
import { insertTestProtocol } from "./insertTestProtocol.js"

describe("insertTestProtocol", () => {
  it("creates a persisted protocol with registry defaults", async () => {
    const insertedProtocol = await insertTestProtocol()
    expect(insertedProtocol.id).toBeDefined()
    expect(insertedProtocol.code).toBe("amneziawg2")
    expect(insertedProtocol.family).toBe("amneziawg")
  })
})
