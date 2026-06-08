import { eq, and, count } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { accessGrant, endpoint, protocol } from "@/core/database/schema.js"

export async function countConfigsByProtocolType(userId: string) {
  return db
    .select({
      protocolTypeId: protocol.typeId,
      used: count(accessGrant.id),
    })
    .from(accessGrant)
    .innerJoin(endpoint, eq(accessGrant.endpointId, endpoint.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .where(and(eq(accessGrant.userId, userId), eq(accessGrant.status, "active")))
    .groupBy(protocol.typeId)
}
