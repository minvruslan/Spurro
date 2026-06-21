import { and, count, eq, inArray } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { accessGrant, endpoint, protocol } from "@/core/database/schema.js"

export async function countConfigsByProtocolTypeForUsers(userIds: string[]) {
  return db
    .select({
      userId: accessGrant.userId,
      protocolTypeId: protocol.protocolTypeId,
      used: count(accessGrant.id),
    })
    .from(accessGrant)
    .innerJoin(endpoint, eq(accessGrant.endpointId, endpoint.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .where(and(inArray(accessGrant.userId, userIds), eq(accessGrant.status, "active")))
    .groupBy(accessGrant.userId, protocol.protocolTypeId)
}
