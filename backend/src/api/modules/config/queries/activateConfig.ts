import { and, eq } from "drizzle-orm"
import type { ConfigData } from "@spurro/api-contract"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function activateConfig(executor: DbOrTx, configId: string, data: ConfigData) {
  return executor
    .update(config)
    .set({ data, status: "active" })
    .where(and(eq(config.id, configId), eq(config.status, "pending")))
    .returning({ id: config.id })
}
