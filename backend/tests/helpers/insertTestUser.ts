import { randomUUID } from "node:crypto"
import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/index.js"
import { createTestEmail } from "./createTestEmail.js"

export async function insertTestUser(
  overrides: Partial<typeof user.$inferInsert> = {},
  executor: DbOrTx = db,
) {
  const [insertedUser] = await executor
    .insert(user)
    .values({
      id: `test-user-${randomUUID()}`,
      name: "Test User",
      email: createTestEmail(),
      ...overrides,
    })
    .returning()
  return insertedUser
}
