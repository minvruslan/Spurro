import { eq } from "drizzle-orm"
import { EndpointDataSchema, ServerDataSchema } from "@spurro/infrastructure/types"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint, protocol, server } from "@/core/database/schemas/domainSchema.js"
import { configLogger } from "@/core/logger/index.js"

export async function findEndpointProtocolClientData(executor: DbOrTx, endpointId: string) {
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

  if (!row) return undefined

  const parsedServerData = ServerDataSchema.safeParse(row.serverData)
  if (!parsedServerData.success && row.serverData !== null) {
    configLogger.warn(
      { endpointId, issues: parsedServerData.error.issues },
      "Server data failed schema validation.",
    )
  }

  const parsedEndpointData = EndpointDataSchema.safeParse(row.endpointData)
  if (!parsedEndpointData.success) {
    configLogger.warn(
      { endpointId, issues: parsedEndpointData.error.issues },
      "Endpoint data failed schema validation.",
    )
  }

  return {
    serverIp: row.serverIp,
    protocolCode: row.protocolCode,
    serverData: parsedServerData.success ? parsedServerData.data : null,
    endpointData: parsedEndpointData.success ? parsedEndpointData.data : null,
  }
}
