import { and, eq, isNull, ne, or } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/authSchema.js"

export async function deleteUser(executor: DbOrTx, userId: string) {
  return executor
    .delete(user)
    .where(and(eq(user.id, userId), or(isNull(user.role), ne(user.role, "admin"))))
    .returning({ id: user.id })
}
