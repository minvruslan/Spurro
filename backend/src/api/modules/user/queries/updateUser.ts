import { and, eq, isNull, ne, or } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/authSchema.js"
import { userSelection } from "@/core/database/selections/index.js"

export async function updateUser(
  executor: DbOrTx,
  userId: string,
  fields: { name: string; email: string },
) {
  return executor
    .update(user)
    .set({ name: fields.name, email: fields.email })
    .where(and(eq(user.id, userId), or(isNull(user.role), ne(user.role, "admin"))))
    .returning(userSelection)
}
