import { eq } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { userLimit, protocolType } from "@/core/database/schema.js"

export async function findConfigLimits(userId: string) {
  return db
    .select({
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
    .where(eq(userLimit.userId, userId))
}
