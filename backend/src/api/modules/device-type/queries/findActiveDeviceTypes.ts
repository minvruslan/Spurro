import { asc, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schemas/domainSchema.js"
import { deviceTypeSelection } from "@/core/database/selections/index.js"

export async function findActiveDeviceTypes(executor: DbOrTx) {
  return executor
    .select(deviceTypeSelection)
    .from(deviceType)
    .where(eq(deviceType.isEnabled, true))
    .orderBy(asc(deviceType.name))
}
