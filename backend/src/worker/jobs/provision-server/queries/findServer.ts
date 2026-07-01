import { AMNEZIAWG_PROTOCOL_CODE } from "@spurro/shared"
import { and, eq } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { endpoint, protocol, protocolType, server } from "@/core/database/schemas/domainSchema.js"

export async function findServer(serverId: string) {
  const [row] = await db
    .select({ ip: server.ip, data: server.data, amneziawgPort: endpoint.port })
    .from(server)
    .innerJoin(endpoint, and(eq(endpoint.serverId, server.id), eq(endpoint.status, "active")))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .innerJoin(
      protocolType,
      and(
        eq(protocol.protocolTypeId, protocolType.id),
        eq(protocolType.code, AMNEZIAWG_PROTOCOL_CODE),
      ),
    )
    .where(eq(server.id, serverId))
    .limit(1)

  return row
}
