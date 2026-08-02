import { randomUUID } from "node:crypto"
import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { protocol } from "@/core/database/schemas/index.js"

export async function insertTestProtocol(
  overrides: Partial<typeof protocol.$inferInsert> = {},
  executor: DbOrTx = db,
) {
  const [insertedProtocol] = await executor
    .insert(protocol)
    .values({
      code: `test-protocol-${randomUUID()}`,
      family: "amneziawg",
      name: "Test Protocol",
      ...overrides,
    })
    .returning()
  return insertedProtocol
}
