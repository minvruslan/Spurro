import { inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { protocol } from "@/core/database/schemas/domainSchema.js"

export async function findProtocolCodes(executor: DbOrTx, protocolIds: string[]) {
  if (protocolIds.length === 0) return []
  return executor
    .select({
      protocolId: protocol.id,
      protocolCode: protocol.code,
    })
    .from(protocol)
    .where(inArray(protocol.id, protocolIds))
}
