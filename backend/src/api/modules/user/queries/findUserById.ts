import { and, eq, isNull, ne, or } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/authSchema.js"

export async function findUserById(executor: DbOrTx, userId: string) {
  return executor
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(and(eq(user.id, userId), or(isNull(user.role), ne(user.role, "admin"))))
    .limit(1)
}
