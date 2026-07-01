import { asc, desc, eq, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint, protocol, protocolType, server } from "@/core/database/schemas/domainSchema.js"
import { serverSelection } from "@/core/database/selections/index.js"

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
