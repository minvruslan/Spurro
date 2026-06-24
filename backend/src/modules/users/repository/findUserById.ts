import { and, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { user } from "@/core/database/auth-schema.js"
import { notAdmin } from "./notAdmin.js"

export async function findUserById(executor: DbOrTx, id: string) {
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
    .where(and(eq(user.id, id), notAdmin()))
    .limit(1)
}
