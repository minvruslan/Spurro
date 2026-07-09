import { eq } from "drizzle-orm"
import type { Amneziawg2ConfigData } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function updateConfigData(
  executor: DbOrTx,
  configId: string,
  data: Amneziawg2ConfigData,
) {
  return executor
    .update(config)
    .set({ data, status: "active" })
    .where(eq(config.id, configId))
    .returning({ id: config.id })
}
