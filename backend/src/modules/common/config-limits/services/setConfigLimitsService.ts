import type { UpsertConfigLimit } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { DbOrTx } from "@/core/database/index.js"
import { deleteConfigLimits } from "../repository/deleteConfigLimits.js"
import { insertConfigLimits } from "../repository/insertConfigLimits.js"

export async function setConfigLimitsService(
  userId: string,
  limits: UpsertConfigLimit[],
  executor: DbOrTx = db,
): Promise<void> {
  await executor.transaction(async (tx) => {
    await deleteConfigLimits(tx, userId)
    await insertConfigLimits(tx, userId, limits)
  })
}
