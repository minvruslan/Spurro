import type { Config, UpdateConfig } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findConfigById } from "../queries/findConfigById.js"
import { findActiveDeviceTypeById } from "../queries/findActiveDeviceTypeById.js"
import { updateUserConfig } from "../queries/updateUserConfig.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

type ErrorCode = "not_found" | "device_type_invalid"

export async function updateUserConfigService(
  userId: string,
  configId: string,
  input: UpdateConfig,
): Promise<ServiceResult<{ config: Config }, ErrorCode>> {
  return db.transaction(async (tx) => {
    const deviceType = await findActiveDeviceTypeById(tx, input.deviceTypeId)
    if (!deviceType) return { ok: false, reason: "device_type_invalid" }

    const [row] = await updateUserConfig(tx, userId, configId, {
      name: input.name,
      deviceTypeId: input.deviceTypeId,
    })

    if (!row) return { ok: false, reason: "not_found" }

    const rows = await findConfigById(tx, row.id)
    return { ok: true, data: { config: ConfigSchema.parse(createConfigFromDatabaseData(rows[0])) } }
  })
}
