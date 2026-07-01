import { and, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function deleteUserConfig(executor: DbOrTx, userId: string, configId: string) {
  return executor
    .delete(config)
    .where(and(eq(config.id, configId), eq(config.userId, userId)))
    .returning({ id: config.id })
}
