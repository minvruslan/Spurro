import { ProtocolRegistry } from "@spurro/infrastructure/types"
import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { configLimit } from "@/core/database/schemas/index.js"

export async function insertTestConfigLimit(
  overrides: Partial<typeof configLimit.$inferInsert> &
    Pick<typeof configLimit.$inferInsert, "userId">,
  executor: DbOrTx = db,
) {
  const [insertedConfigLimit] = await executor
    .insert(configLimit)
    .values({
      protocolFamily: ProtocolRegistry.amneziawg2.family,
      maxCount: 3,
      ...overrides,
    })
    .returning()
  return insertedConfigLimit
}
