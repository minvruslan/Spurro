import { asc, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { protocol } from "@/core/database/schemas/domainSchema.js"
import { protocolSelection } from "@/core/database/selections/index.js"

export async function findProtocols(executor: DbOrTx) {
  return executor
    .select(protocolSelection)
    .from(protocol)
    .where(eq(protocol.isEnabled, true))
    .orderBy(asc(protocol.name))
}
