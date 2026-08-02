import { beforeEach, describe, expect, it } from "vitest"
import { db } from "@/core/database/index.js"
import { config, endpoint, protocol } from "@/core/database/schemas/index.js"
import { insertTestEndpoint } from "./insertTestEndpoint.js"
import { insertTestProtocol } from "./insertTestProtocol.js"
import { insertTestServer } from "./insertTestServer.js"

describe("insertTestEndpoint", () => {
  beforeEach(async () => {
    await db.delete(config)
    await db.delete(endpoint)
    await db.delete(protocol)
  })

  it("creates a persisted active endpoint bound to its server and protocol", async () => {
    const endpointServer = await insertTestServer()
    const endpointProtocol = await insertTestProtocol()
    const insertedEndpoint = await insertTestEndpoint({
      serverId: endpointServer.id,
      protocolId: endpointProtocol.id,
    })

    expect(insertedEndpoint.serverId).toBe(endpointServer.id)
    expect(insertedEndpoint.protocolId).toBe(endpointProtocol.id)
    expect(insertedEndpoint.status).toBe("active")
  })
})
