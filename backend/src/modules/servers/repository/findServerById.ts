import { asc, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint, protocol, protocolType, server } from "@/core/database/schema.js"
import { serverSelection } from "./findServers.js"

export async function findServerById(executor: DbOrTx, id: string) {
  return executor
    .select(serverSelection)
    .from(server)
    .leftJoin(endpoint, eq(endpoint.serverId, server.id))
    .leftJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .leftJoin(protocolType, eq(protocol.protocolTypeId, protocolType.id))
    .where(eq(server.id, id))
    .orderBy(asc(endpoint.port))
}
