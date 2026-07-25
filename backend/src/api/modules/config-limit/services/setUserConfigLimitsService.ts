import type { UpsertConfigLimit } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { DbOrTx } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { deleteUserConfigLimits } from "../queries/deleteUserConfigLimits.js"
import { insertUserConfigLimits } from "../queries/insertUserConfigLimits.js"

export async function setUserConfigLimitsService(
  userId: string,
  limits: UpsertConfigLimit[],
  executor: DbOrTx = db,
): Promise<ServiceResult<null>> {
  await executor.transaction(async (tx) => {
    await deleteUserConfigLimits(tx, userId)
    await insertUserConfigLimits(tx, userId, limits)
  })
  return { ok: true, data: null }
}
