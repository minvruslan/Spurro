import { count, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function countUserConfigsRequiringCleanup(executor: DbOrTx, userId: string) {
  const [row] = await executor
    .select({ value: count() })
    .from(config)
    .where(eq(config.userId, userId))
  return row.value
}
