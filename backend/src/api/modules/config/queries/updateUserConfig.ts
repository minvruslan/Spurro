import { and, eq } from "drizzle-orm"
import { reservedConfigCondition } from "@/api/modules/config-limit/index.js"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function updateUserConfig(
  executor: DbOrTx,
  userId: string,
  configId: string,
  fields: { name: string; deviceTypeId: string },
) {
  return executor
    .update(config)
    .set({ name: fields.name, deviceTypeId: fields.deviceTypeId })
    .where(and(eq(config.id, configId), eq(config.userId, userId), reservedConfigCondition()))
    .returning({ id: config.id })
}
