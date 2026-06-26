import { asc, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schema.js"

export async function findDeviceTypes(executor: DbOrTx) {
  return executor
    .select({
      id: deviceType.id,
      code: deviceType.code,
      name: deviceType.name,
    })
    .from(deviceType)
    .where(eq(deviceType.isEnabled, true))
    .orderBy(asc(deviceType.name))
}
