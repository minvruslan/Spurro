import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import {
  accessGrant,
  deviceType,
  endpoint,
  protocol,
  protocolType,
  server,
} from "@/core/database/schemas/domainSchema.js"
import { configSelection } from "./findConfigs.js"

export async function findConfigById(executor: DbOrTx, id: string) {
  return executor
    .select(configSelection)
    .from(accessGrant)
    .innerJoin(deviceType, eq(accessGrant.deviceTypeId, deviceType.id))
    .innerJoin(endpoint, eq(accessGrant.endpointId, endpoint.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .innerJoin(protocolType, eq(protocol.protocolTypeId, protocolType.id))
    .innerJoin(server, eq(endpoint.serverId, server.id))
    .where(eq(accessGrant.id, id))
}
