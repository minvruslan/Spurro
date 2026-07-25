import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint, protocol, server } from "@/core/database/schemas/domainSchema.js"

export async function findEndpointAccessData(executor: DbOrTx, endpointId: string) {
  const [row] = await executor
    .select({
      serverIp: server.ip,
      serverData: server.data,
      endpointData: endpoint.data,
      protocolCode: protocol.code,
    })
    .from(endpoint)
    .innerJoin(server, eq(endpoint.serverId, server.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .where(eq(endpoint.id, endpointId))
    .limit(1)
  return row
}
