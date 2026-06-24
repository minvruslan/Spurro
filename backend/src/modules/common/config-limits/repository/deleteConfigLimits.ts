import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { userLimit } from "@/core/database/schema.js"

export async function deleteConfigLimits(executor: DbOrTx, userId: string) {
  await executor.delete(userLimit).where(eq(userLimit.userId, userId))
}
