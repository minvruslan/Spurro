import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { configLimit, protocolType } from "@/core/database/schemas/domainSchema.js"

export async function findUserConfigLimits(executor: DbOrTx, userId: string) {
  return executor
    .select({
      id: configLimit.id,
      maxCount: configLimit.maxCount,
      createdAt: configLimit.createdAt,
      updatedAt: configLimit.updatedAt,
      protocolTypeId: protocolType.id,
      protocolTypeCode: protocolType.code,
      protocolTypeName: protocolType.name,
    })
    .from(configLimit)
    .innerJoin(protocolType, eq(configLimit.protocolTypeId, protocolType.id))
    .where(eq(configLimit.userId, userId))
}
