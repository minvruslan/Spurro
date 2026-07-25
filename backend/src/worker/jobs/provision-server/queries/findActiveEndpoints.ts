import { and, eq } from "drizzle-orm"
import { EndpointDataSchema } from "@spurro/infrastructure/types"
import { db } from "@/core/database/index.js"
import { endpoint, protocol } from "@/core/database/schemas/domainSchema.js"
import { workerLogger } from "@/core/logger/index.js"

export async function findActiveEndpoints(serverId: string) {
  const rows = await db
    .select({
      endpointId: endpoint.id,
      port: endpoint.port,
      data: endpoint.data,
      protocolCode: protocol.code,
    })
    .from(endpoint)
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .where(and(eq(endpoint.serverId, serverId), eq(endpoint.status, "active")))

  return rows.map((row) => {
    const parsedData = EndpointDataSchema.safeParse(row.data)
    if (!parsedData.success) {
      workerLogger.warn(
        { serverId, endpointId: row.endpointId, issues: parsedData.error.issues },
        "Endpoint data failed schema validation.",
      )
    }
    return { ...row, data: parsedData.success ? parsedData.data : null }
  })
}
