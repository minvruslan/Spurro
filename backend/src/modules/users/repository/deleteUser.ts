import { and, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { user } from "@/core/database/auth-schema.js"
import { notAdmin } from "./notAdmin.js"

export async function deleteUser(executor: DbOrTx, id: string) {
  return executor
    .delete(user)
    .where(and(eq(user.id, id), notAdmin()))
    .returning({ id: user.id })
}
