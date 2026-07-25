import { and, count, eq, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function countUserConfigsRequiringCleanup(executor: DbOrTx, userId: string) {
  const [row] = await executor
    .select({ value: count() })
    .from(config)
    .where(and(eq(config.userId, userId), ne(config.status, "deleted")))
  return row?.value ?? 0
}
