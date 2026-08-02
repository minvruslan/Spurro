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
      code: "amneziawg2",
      family: "amneziawg",
      name: "AmneziaWG 2",
      ...overrides,
    })
    .returning()
  return insertedProtocol
}
