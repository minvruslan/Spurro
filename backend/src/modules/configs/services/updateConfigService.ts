import type { Config, UpdateConfig } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findConfigById } from "../repository/findConfigById.js"
import { findEnabledDeviceTypeById } from "../repository/findEnabledDeviceTypeById.js"
import { updateConfig } from "../repository/updateConfig.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

type UpdateConfigResult =
  | { ok: true; data: Config }
  | { ok: false; reason: "not_found" | "device_type_invalid" }

export async function updateConfigService(
  userId: string,
  id: string,
  input: UpdateConfig,
): Promise<UpdateConfigResult> {
  return db.transaction(async (tx) => {
    const deviceType = await findEnabledDeviceTypeById(tx, input.deviceTypeId)
    if (!deviceType) return { ok: false, reason: "device_type_invalid" }

    const [row] = await updateConfig(tx, userId, id, {
      name: input.name,
      deviceTypeId: input.deviceTypeId,
    })
    if (!row) return { ok: false, reason: "not_found" }

    const rows = await findConfigById(tx, row.id)
    return { ok: true, data: ConfigSchema.parse(createConfigFromDatabaseData(rows[0])) }
  })
}
