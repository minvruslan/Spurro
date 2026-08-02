import { randomUUID } from "node:crypto"
import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/index.js"

export async function insertTestServer(
  overrides: Partial<typeof server.$inferInsert> = {},
  executor: DbOrTx = db,
) {
  const [insertedServer] = await executor
    .insert(server)
    .values({
      name: `Test Server ${randomUUID()}`,
      ip: "192.0.2.1",
      country: "NL",
      ...overrides,
    })
    .returning()
  return insertedServer
}
