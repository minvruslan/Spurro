import { asc, desc, eq, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint, protocol, protocolType, server } from "@/core/database/schema.js"

export const serverSelection = {
  id: server.id,
  name: server.name,
  domainName: server.domainName,
  ip: server.ip,
  country: server.country,
  status: server.status,
  isCurrent: server.isCurrent,
  createdAt: server.createdAt,
  updatedAt: server.updatedAt,
  endpointId: endpoint.id,
  endpointPort: endpoint.port,
  endpointStatus: endpoint.status,
  protocolId: protocol.id,
  protocolVersion: protocol.version,
  protocolTypeId: protocolType.id,
  protocolTypeCode: protocolType.code,
  protocolTypeName: protocolType.name,
}

export async function findServers(executor: DbOrTx) {
  return executor
    .select(serverSelection)
    .from(server)
    .leftJoin(endpoint, eq(endpoint.serverId, server.id))
    .leftJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .leftJoin(protocolType, eq(protocol.protocolTypeId, protocolType.id))
    .where(ne(server.status, "deleted"))
    .orderBy(desc(server.createdAt), asc(endpoint.port))
}
