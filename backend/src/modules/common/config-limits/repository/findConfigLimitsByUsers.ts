import { eq, inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { userLimit, protocolType } from "@/core/database/schema.js"

export async function findConfigLimitsByUsers(executor: DbOrTx, userIds: string[]) {
  return executor
    .select({
      userId: userLimit.userId,
      id: userLimit.id,
      maxCount: userLimit.maxCount,
      createdAt: userLimit.createdAt,
      updatedAt: userLimit.updatedAt,
      protocolTypeId: protocolType.id,
      protocolTypeCode: protocolType.code,
      protocolTypeName: protocolType.name,
    })
    .from(userLimit)
    .innerJoin(protocolType, eq(userLimit.protocolTypeId, protocolType.id))
    .where(inArray(userLimit.userId, userIds))
}
