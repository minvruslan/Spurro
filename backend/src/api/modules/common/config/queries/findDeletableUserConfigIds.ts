import { and, eq, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function findDeletableUserConfigIds(executor: DbOrTx, userId: string) {
  return executor
    .select({ id: config.id })
    .from(config)
    .where(and(eq(config.userId, userId), ne(config.status, "deleted")))
}
