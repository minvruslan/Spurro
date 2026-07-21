import { and, count, eq, inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint, protocol } from "@/core/database/schemas/domainSchema.js"

export async function countUsersConfigsByProtocolFamily(executor: DbOrTx, userIds: string[]) {
  return executor
    .select({
      userId: config.userId,
      protocolFamily: protocol.family,
      used: count(config.id),
    })
    .from(config)
    .innerJoin(endpoint, eq(config.endpointId, endpoint.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .where(and(inArray(config.userId, userIds), eq(config.status, "active")))
    .groupBy(config.userId, protocol.family)
}
