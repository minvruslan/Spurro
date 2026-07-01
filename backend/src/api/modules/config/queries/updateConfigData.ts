import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function updateConfigData(executor: DbOrTx, configId: string, data: unknown) {
  return executor
    .update(config)
    .set({ data })
    .where(eq(config.id, configId))
    .returning({ id: config.id })
}
