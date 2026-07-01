import { and, asc, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint, protocol, protocolType, server } from "@/core/database/schemas/domainSchema.js"
import { endpointSelection } from "@/core/database/selections/index.js"

export async function findActiveEndpoints(executor: DbOrTx) {
  return executor
    .select(endpointSelection)
    .from(endpoint)
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .innerJoin(protocolType, eq(protocol.protocolTypeId, protocolType.id))
    .innerJoin(server, eq(endpoint.serverId, server.id))
    .where(and(eq(endpoint.status, "active"), eq(server.status, "active")))
    .orderBy(asc(server.country), asc(endpoint.port))
}
