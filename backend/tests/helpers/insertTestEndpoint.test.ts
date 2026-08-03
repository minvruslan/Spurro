import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/core/database/index.js"
import { insertTestEndpoint } from "./insertTestEndpoint.js"
import { insertTestProtocol } from "./insertTestProtocol.js"
import { insertTestServer } from "./insertTestServer.js"

describe("insertTestEndpoint", () => {
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

  it("stores the data column encrypted at rest", async () => {
    const endpointServer = await insertTestServer()
    const endpointProtocol = await insertTestProtocol()
    const insertedEndpoint = await insertTestEndpoint({
      serverId: endpointServer.id,
      protocolId: endpointProtocol.id,
    })

    const rawEndpointRows = await db.execute<{ data: string }>(
      sql`select data::text as data from endpoint where id = ${insertedEndpoint.id}::uuid`,
    )
    expect(rawEndpointRows).toHaveLength(1)
    expect(rawEndpointRows[0]?.data.startsWith("v1:")).toBe(true)
    expect(rawEndpointRows[0]?.data).not.toContain("amneziawg2")
  })
})
