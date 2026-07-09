import { and, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import {
  config,
  deviceType,
  endpoint,
  protocol,
  server,
} from "@/core/database/schemas/domainSchema.js"
import { configSelection } from "@/core/database/selections/index.js"

export async function findUserConfig(executor: DbOrTx, userId: string, configId: string) {
  return executor
    .select(configSelection)
    .from(config)
    .innerJoin(deviceType, eq(config.deviceTypeId, deviceType.id))
    .innerJoin(endpoint, eq(config.endpointId, endpoint.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .innerJoin(server, eq(endpoint.serverId, server.id))
    .where(and(eq(config.id, configId), eq(config.userId, userId), eq(config.status, "active")))
}
