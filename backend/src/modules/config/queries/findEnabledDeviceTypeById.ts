import { and, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schemas/domainSchema.js"

export async function findEnabledDeviceTypeById(executor: DbOrTx, id: string) {
  const [row] = await executor
    .select({ id: deviceType.id })
    .from(deviceType)
    .where(and(eq(deviceType.id, id), eq(deviceType.isEnabled, true)))
    .limit(1)
  return row
}
