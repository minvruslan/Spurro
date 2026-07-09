import { and, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint, protocol, server } from "@/core/database/schemas/domainSchema.js"
import { endpointSelection } from "@/core/database/selections/index.js"

export async function findActiveEndpointById(executor: DbOrTx, endpointId: string) {
  const [row] = await executor
    .select(endpointSelection)
    .from(endpoint)
    .innerJoin(server, eq(endpoint.serverId, server.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .where(
      and(eq(endpoint.id, endpointId), eq(endpoint.status, "active"), eq(server.status, "active")),
    )
    .limit(1)
  return row
}
