import { asc, isNull, ne, or } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/authSchema.js"
import { userSelection } from "@/core/database/selections/index.js"

export async function findUsers(executor: DbOrTx) {
  return executor
    .select(userSelection)
    .from(user)
    .where(or(isNull(user.role), ne(user.role, "admin")))
    .orderBy(asc(user.name))
}
