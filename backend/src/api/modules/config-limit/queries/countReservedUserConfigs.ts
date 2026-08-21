import { and, count, eq } from "drizzle-orm"
import type { ProtocolFamilyCode } from "@vancloak/api-contract"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint, protocol } from "@/core/database/schemas/domainSchema.js"
import { reservedConfigCondition } from "./conditions/reservedConfigCondition.js"

export async function countReservedUserConfigs(
  executor: DbOrTx,
  userId: string,
  protocolFamily: ProtocolFamilyCode,
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
        reservedConfigCondition(),
      ),
    )
  return row.reserved
}
