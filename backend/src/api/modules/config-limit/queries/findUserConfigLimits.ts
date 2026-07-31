import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { configLimit } from "@/core/database/schemas/domainSchema.js"
import { configLimitSelection } from "@/core/database/selections/index.js"

export async function findUserConfigLimits(executor: DbOrTx, userId: string) {
  return executor
    .select(configLimitSelection)
    .from(configLimit)
    .where(eq(configLimit.userId, userId))
}
