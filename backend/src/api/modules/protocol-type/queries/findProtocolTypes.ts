import { asc, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { protocolType } from "@/core/database/schemas/domainSchema.js"
import { protocolTypeSelection } from "@/core/database/selections/index.js"

export async function findProtocolTypes(executor: DbOrTx) {
  return executor
    .select(protocolTypeSelection)
    .from(protocolType)
    .where(eq(protocolType.isEnabled, true))
    .orderBy(asc(protocolType.name))
}
