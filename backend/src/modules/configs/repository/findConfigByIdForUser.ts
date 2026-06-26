import { and, eq, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import {
  accessGrant,
  deviceType,
  endpoint,
  protocol,
  protocolType,
  server,
} from "@/core/database/schema.js"
import { configSelection } from "./findConfigs.js"

export async function findConfigByIdForUser(executor: DbOrTx, userId: string, id: string) {
  return executor
    .select(configSelection)
    .from(accessGrant)
    .innerJoin(deviceType, eq(accessGrant.deviceTypeId, deviceType.id))
    .innerJoin(endpoint, eq(accessGrant.endpointId, endpoint.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .innerJoin(protocolType, eq(protocol.protocolTypeId, protocolType.id))
    .innerJoin(server, eq(endpoint.serverId, server.id))
    .where(
      and(
        eq(accessGrant.id, id),
        eq(accessGrant.userId, userId),
        ne(accessGrant.status, "deleted"),
      ),
    )
}
