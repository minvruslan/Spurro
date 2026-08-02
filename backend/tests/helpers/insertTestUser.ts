import { randomUUID } from "node:crypto"
import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/index.js"

export async function insertTestUser(
  overrides: Partial<typeof user.$inferInsert> = {},
  executor: DbOrTx = db,
) {
  const uniqueSuffix = randomUUID()
  const [insertedUser] = await executor
    .insert(user)
    .values({
      id: `test-user-${uniqueSuffix}`,
      name: "Test User",
      email: `test-user-${uniqueSuffix}@test.local`,
      ...overrides,
    })
    .returning()
  return insertedUser
}
