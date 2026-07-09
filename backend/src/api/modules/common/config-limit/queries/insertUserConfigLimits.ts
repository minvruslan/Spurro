import type { UpsertConfigLimit } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { configLimit } from "@/core/database/schemas/domainSchema.js"

export async function insertUserConfigLimits(
  executor: DbOrTx,
  userId: string,
  limits: UpsertConfigLimit[],
) {
  if (limits.length === 0) return
  await executor.insert(configLimit).values(
    limits.map((item) => ({
      userId,
      protocolFamily: item.protocolFamily,
      maxCount: item.maxCount,
    })),
  )
}
