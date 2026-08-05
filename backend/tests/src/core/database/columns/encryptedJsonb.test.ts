import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/core/database/index.js"
import { insertTestEndpoint, insertTestProtocol, insertTestServer } from "@tests/helpers/index.js"

describe("encryptedJsonb", () => {
  it("stores the endpoint data column encrypted at rest", async () => {
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
