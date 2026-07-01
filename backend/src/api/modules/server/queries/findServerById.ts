import { asc, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint, protocol, protocolType, server } from "@/core/database/schemas/domainSchema.js"
import { serverSelection } from "@/core/database/selections/index.js"

export async function findServerById(executor: DbOrTx, serverId: string) {
  return executor
    .select(serverSelection)
    .from(server)
    .leftJoin(endpoint, eq(endpoint.serverId, server.id))
    .leftJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .leftJoin(protocolType, eq(protocol.protocolTypeId, protocolType.id))
    .where(eq(server.id, serverId))
    .orderBy(asc(endpoint.port))
}
