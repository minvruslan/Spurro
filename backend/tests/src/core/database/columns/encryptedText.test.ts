import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { decryptString } from "@/core/crypto/index.js"
import { db } from "@/core/database/index.js"
import { insertTestServer } from "@tests/helpers/index.js"

describe("encryptedText", () => {
  it("stores the server ip column encrypted at rest", async () => {
    const insertedServer = await insertTestServer()

    const rawServerRows = await db.execute<{ ip: string }>(
      sql`select ip::text as ip from server where id = ${insertedServer.id}::uuid`,
    )
    expect(rawServerRows).toHaveLength(1)
    const rawIp = rawServerRows[0].ip
    expect(rawIp.startsWith("v1:")).toBe(true)
    expect(rawIp).not.toContain(insertedServer.ip)
    expect(decryptString(rawIp)).toBe(insertedServer.ip)
  })
})
