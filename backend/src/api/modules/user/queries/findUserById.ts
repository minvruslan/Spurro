import { and, eq, isNull, ne, or } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/authSchema.js"
import { userSelection } from "@/core/database/selections/index.js"

export async function findUserById(executor: DbOrTx, userId: string) {
  return executor
    .select(userSelection)
    .from(user)
    .where(and(eq(user.id, userId), or(isNull(user.role), ne(user.role, "admin"))))
    .limit(1)
}
