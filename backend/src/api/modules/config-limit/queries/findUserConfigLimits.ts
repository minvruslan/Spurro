import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { configLimit } from "@/core/database/schemas/domainSchema.js"

export async function findUserConfigLimits(executor: DbOrTx, userId: string) {
  return executor
    .select({
      id: configLimit.id,
      protocolFamily: configLimit.protocolFamily,
      maxCount: configLimit.maxCount,
      createdAt: configLimit.createdAt,
      updatedAt: configLimit.updatedAt,
    })
    .from(configLimit)
    .where(eq(configLimit.userId, userId))
}
