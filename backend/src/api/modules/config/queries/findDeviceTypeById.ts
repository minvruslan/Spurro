import { and, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schemas/domainSchema.js"

export async function findDeviceTypeById(executor: DbOrTx, deviceTypeId: string) {
  const [row] = await executor
    .select({ id: deviceType.id })
    .from(deviceType)
    .where(and(eq(deviceType.id, deviceTypeId), eq(deviceType.isEnabled, true)))
    .limit(1)
  return row
}
