import { and, eq, inArray, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import {
  config,
  deviceType,
  endpoint,
  protocol,
  server,
} from "@/core/database/schemas/domainSchema.js"
import { configSelection } from "@/core/database/selections/index.js"

export async function findDeletableUserConfigs(
  executor: DbOrTx,
  userId: string,
  configIds: string[],
) {
  return executor
    .select(configSelection)
    .from(config)
    .innerJoin(deviceType, eq(config.deviceTypeId, deviceType.id))
    .innerJoin(endpoint, eq(config.endpointId, endpoint.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .innerJoin(server, eq(endpoint.serverId, server.id))
    .where(
      and(inArray(config.id, configIds), eq(config.userId, userId), ne(config.status, "deleted")),
    )
}

export type DeletableUserConfig = Awaited<ReturnType<typeof findDeletableUserConfigs>>[number]
