import { eq, and, ne, desc } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import {
  accessGrant,
  deviceType,
  endpoint,
  protocol,
  protocolType,
  server,
} from "@/core/database/schema.js"

export async function findConfigs(userId: string) {
  return db
    .select({
      id: accessGrant.id,
      name: accessGrant.name,
      config: accessGrant.config,
      status: accessGrant.status,
      createdAt: accessGrant.createdAt,
      updatedAt: accessGrant.updatedAt,
      deviceTypeId: deviceType.id,
      deviceTypeCode: deviceType.code,
      deviceTypeName: deviceType.name,
      endpointId: endpoint.id,
      endpointPort: endpoint.port,
      protocolId: protocol.id,
      protocolVersion: protocol.version,
      protocolTypeId: protocolType.id,
      protocolTypeCode: protocolType.code,
      protocolTypeName: protocolType.name,
      serverId: server.id,
      serverName: server.name,
      serverCountry: server.country,
    })
    .from(accessGrant)
    .innerJoin(deviceType, eq(accessGrant.deviceTypeId, deviceType.id))
    .innerJoin(endpoint, eq(accessGrant.endpointId, endpoint.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .innerJoin(protocolType, eq(protocol.protocolTypeId, protocolType.id))
    .innerJoin(server, eq(endpoint.serverId, server.id))
    .where(and(eq(accessGrant.userId, userId), ne(accessGrant.status, "deleted")))
    .orderBy(desc(accessGrant.createdAt))
}
