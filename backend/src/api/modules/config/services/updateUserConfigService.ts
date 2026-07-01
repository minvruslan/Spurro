import type { Config, UpdateConfig } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findConfigById } from "../queries/findConfigById.js"
import { findDeviceTypeById } from "../queries/findDeviceTypeById.js"
import { updateUserConfig } from "../queries/updateUserConfig.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

type UpdateConfigResult =
  | { ok: true; data: Config }
  | { ok: false; reason: "not_found" | "device_type_invalid" }

export async function updateUserConfigService(
  userId: string,
  configId: string,
  input: UpdateConfig,
): Promise<UpdateConfigResult> {
  return db.transaction(async (tx) => {
    const deviceType = await findDeviceTypeById(tx, input.deviceTypeId)
    if (!deviceType) return { ok: false, reason: "device_type_invalid" }

    const [row] = await updateUserConfig(tx, userId, configId, {
      name: input.name,
      deviceTypeId: input.deviceTypeId,
    })

    if (!row) return { ok: false, reason: "not_found" }

    const rows = await findConfigById(tx, row.id)
    return { ok: true, data: ConfigSchema.parse(createConfigFromDatabaseData(rows[0])) }
  })
}
