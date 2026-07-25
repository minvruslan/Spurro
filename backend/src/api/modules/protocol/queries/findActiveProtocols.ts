import { and, asc, eq, inArray } from "drizzle-orm"
import { SUPPORTED_PROTOCOLS } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { protocol } from "@/core/database/schemas/domainSchema.js"
import { protocolSelection } from "@/core/database/selections/index.js"

export async function findActiveProtocols(executor: DbOrTx) {
  return executor
    .select(protocolSelection)
    .from(protocol)
    .where(
      and(eq(protocol.isEnabled, true), inArray(protocol.code, Object.keys(SUPPORTED_PROTOCOLS))),
    )
    .orderBy(asc(protocol.name))
}
