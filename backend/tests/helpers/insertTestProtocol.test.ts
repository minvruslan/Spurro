import { describe, expect, it } from "vitest"
import { insertTestProtocol } from "./insertTestProtocol.js"

describe("insertTestProtocol", () => {
  it("creates a persisted protocol with unique code", async () => {
    const firstProtocol = await insertTestProtocol()
    const secondProtocol = await insertTestProtocol()
    expect(firstProtocol.family).toBe("amneziawg")
    expect(firstProtocol.code).not.toBe(secondProtocol.code)
  })
})
