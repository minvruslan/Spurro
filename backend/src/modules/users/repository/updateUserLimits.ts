import { eq } from "drizzle-orm"
import type { UpsertConfigLimit } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { userLimit } from "@/core/database/schema.js"
import { insertUserLimits } from "./insertUserLimits.js"

export async function updateUserLimits(
  executor: DbOrTx,
  userId: string,
  limits: UpsertConfigLimit[],
) {
  await executor.delete(userLimit).where(eq(userLimit.userId, userId))
  await insertUserLimits(executor, userId, limits)
}
