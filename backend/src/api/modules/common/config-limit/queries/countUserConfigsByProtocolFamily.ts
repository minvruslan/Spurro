import { eq, and, count } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint, protocol } from "@/core/database/schemas/domainSchema.js"

export async function countUserConfigsByProtocolFamily(executor: DbOrTx, userId: string) {
  return executor
    .select({
      protocolFamily: protocol.family,
      used: count(config.id),
    })
    .from(config)
    .innerJoin(endpoint, eq(config.endpointId, endpoint.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .where(and(eq(config.userId, userId), eq(config.status, "active")))
    .groupBy(protocol.family)
}
