import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { configLimit } from "@/core/database/schemas/domainSchema.js"

export async function deleteUserConfigLimits(executor: DbOrTx, userId: string) {
  await executor.delete(configLimit).where(eq(configLimit.userId, userId))
}
