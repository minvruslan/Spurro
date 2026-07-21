import { inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { configLimit } from "@/core/database/schemas/domainSchema.js"

export async function findUsersConfigLimits(executor: DbOrTx, userIds: string[]) {
  return executor
    .select({
      userId: configLimit.userId,
      id: configLimit.id,
      protocolFamily: configLimit.protocolFamily,
      maxCount: configLimit.maxCount,
      createdAt: configLimit.createdAt,
      updatedAt: configLimit.updatedAt,
    })
    .from(configLimit)
    .where(inArray(configLimit.userId, userIds))
}
