import { and, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { user } from "@/core/database/auth-schema.js"
import { notAdmin } from "./notAdmin.js"

export async function updateUser(executor: DbOrTx, id: string, fields: { name: string }) {
  return executor
    .update(user)
    .set({ name: fields.name })
    .where(and(eq(user.id, id), notAdmin()))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
}
