import { eq, inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { configLimit, protocolType } from "@/core/database/schemas/domainSchema.js"

export async function findUsersConfigLimits(executor: DbOrTx, userIds: string[]) {
  return executor
    .select({
      userId: configLimit.userId,
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
    .where(inArray(configLimit.userId, userIds))
}
