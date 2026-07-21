import { and, count, eq, ne } from "drizzle-orm"
import type { SupportedProtocolFamily } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint, protocol } from "@/core/database/schemas/domainSchema.js"

export async function countReservedUserConfigs(
  executor: DbOrTx,
  userId: string,
  protocolFamily: SupportedProtocolFamily,
) {
  const [row] = await executor
    .select({ reserved: count(config.id) })
    .from(config)
    .innerJoin(endpoint, eq(config.endpointId, endpoint.id))
    .innerJoin(protocol, eq(endpoint.protocolId, protocol.id))
    .where(
      and(
        eq(config.userId, userId),
        eq(protocol.family, protocolFamily),
        ne(config.status, "deleted"),
      ),
    )
  return row.reserved
}
