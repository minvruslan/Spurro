import { inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { configLimit } from "@/core/database/schemas/domainSchema.js"
import { configLimitSelection } from "@/core/database/selections/index.js"

export async function findUsersConfigLimits(executor: DbOrTx, userIds: string[]) {
  return executor
    .select(configLimitSelection)
    .from(configLimit)
    .where(inArray(configLimit.userId, userIds))
}
