import type { UpsertConfigLimit } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { userLimit } from "@/core/database/schema.js"

export async function insertConfigLimits(
  executor: DbOrTx,
  userId: string,
  limits: UpsertConfigLimit[],
) {
  if (limits.length === 0) return
  await executor.insert(userLimit).values(
    limits.map((item) => ({
      userId,
      protocolTypeId: item.protocolTypeId,
      maxCount: item.maxCount,
    })),
  )
}
