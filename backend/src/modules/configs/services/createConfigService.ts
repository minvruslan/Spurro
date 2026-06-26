import type { Config, UpsertConfig } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findActiveEndpointById } from "../repository/findActiveEndpointById.js"
import { findConfigById } from "../repository/findConfigById.js"
import { findEnabledDeviceTypeById } from "../repository/findEnabledDeviceTypeById.js"
import { insertConfig } from "../repository/insertConfig.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

type CreateConfigResult =
  | { ok: true; data: Config }
  | { ok: false; reason: "endpoint_invalid" | "device_type_invalid" }

export async function createConfigService(
  userId: string,
  input: UpsertConfig,
): Promise<CreateConfigResult> {
  return db.transaction(async (tx) => {
    const endpoint = await findActiveEndpointById(tx, input.endpointId)
    if (!endpoint) return { ok: false, reason: "endpoint_invalid" }

    const deviceType = await findEnabledDeviceTypeById(tx, input.deviceTypeId)
    if (!deviceType) return { ok: false, reason: "device_type_invalid" }

    const [row] = await insertConfig(tx, {
      userId,
      endpointId: input.endpointId,
      deviceTypeId: input.deviceTypeId,
      name: input.name,
      config: {},
    })

    const rows = await findConfigById(tx, row.id)
    return { ok: true, data: ConfigSchema.parse(createConfigFromDatabaseData(rows[0])) }
  })
}
