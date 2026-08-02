import { describe, expect, it } from "vitest"
import { insertTestServer } from "./insertTestServer.js"

describe("insertTestServer", () => {
  it("creates a persisted server with a decryptable encrypted ip column", async () => {
    const insertedServer = await insertTestServer()
    expect(insertedServer.ip).toBe("192.0.2.1")
  })
})
