import { and, asc, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint, protocol, protocolType, server } from "@/core/database/schemas/domainSchema.js"

export async function findActiveEndpoints(executor: DbOrTx) {
  return executor
    .select({
      id: endpoint.id,
      port: endpoint.port,
      protocolId: protocol.id,
      protocolVersion: protocol.version,
      protocolTypeId: protocolType.id,
      protocolTypeCode: protocolType.code,
      protocolTypeName: protocolType.name,
      serverId: server.id,
      serverName: server.name,
      serverCountry: server.country,
    })
    .from(endpoint)
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .innerJoin(protocolType, eq(protocol.protocolTypeId, protocolType.id))
    .innerJoin(server, eq(endpoint.serverId, server.id))
    .where(and(eq(endpoint.status, "active"), eq(server.status, "active")))
    .orderBy(asc(server.country), asc(endpoint.port))
}
