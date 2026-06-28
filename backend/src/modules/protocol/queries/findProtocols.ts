import { and, asc, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { protocol, protocolType } from "@/core/database/schemas/domainSchema.js"

export const protocolSelection = {
  id: protocol.id,
  version: protocol.version,
  typeId: protocolType.id,
  typeCode: protocolType.code,
  typeName: protocolType.name,
}

export async function findProtocols(executor: DbOrTx) {
  return executor
    .select(protocolSelection)
    .from(protocol)
    .innerJoin(protocolType, eq(protocol.protocolTypeId, protocolType.id))
    .where(and(eq(protocol.isEnabled, true), eq(protocolType.isEnabled, true)))
    .orderBy(asc(protocolType.name), asc(protocol.version))
}
