import { and, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { accessGrant } from "@/core/database/schemas/domainSchema.js"

export async function deleteConfig(executor: DbOrTx, userId: string, id: string) {
  return executor
    .delete(accessGrant)
    .where(and(eq(accessGrant.id, id), eq(accessGrant.userId, userId)))
    .returning({ id: accessGrant.id })
}
