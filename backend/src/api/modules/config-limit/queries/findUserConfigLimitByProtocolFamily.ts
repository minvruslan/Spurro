import { and, eq } from "drizzle-orm"
import type { SupportedProtocolFamily } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { configLimit } from "@/core/database/schemas/domainSchema.js"

export async function findUserConfigLimitByProtocolFamily(
  executor: DbOrTx,
  userId: string,
  protocolFamily: SupportedProtocolFamily,
) {
  const rows = await executor
    .select({ maxCount: configLimit.maxCount })
    .from(configLimit)
    .where(and(eq(configLimit.userId, userId), eq(configLimit.protocolFamily, protocolFamily)))
  return rows[0]
}
