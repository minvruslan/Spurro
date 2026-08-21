import { bootstrapLogger } from "@/core/logger/index.js"
import { sql } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schemas/domainSchema.js"
import { DEVICE_TYPES } from "./constants/index.js"

export async function bootstrapDeviceTypes() {
  const upserted = await db
    .insert(deviceType)
    .values(DEVICE_TYPES)
    .onConflictDoUpdate({
      target: deviceType.code,
      set: { name: sql`excluded.name`, sortOrder: sql`excluded.sort_order` },
      setWhere: sql`(${deviceType.name}, ${deviceType.sortOrder}) is distinct from (excluded.name, excluded.sort_order)`,
    })
    .returning({ code: deviceType.code })

  if (upserted.length > 0) {
    bootstrapLogger.info(
      `Seeded or renamed device types: ${upserted.map((r) => r.code).join(", ")}.`,
    )
  }
}
