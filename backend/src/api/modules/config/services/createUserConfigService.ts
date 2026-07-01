import type { UpsertConfig } from "@spurro/shared"
import { AMNEZIAWG_PROTOCOL_CODE } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findActiveEndpointById } from "../queries/findActiveEndpointById.js"
import { findDeviceTypeById } from "../queries/findDeviceTypeById.js"
import type { CreateConfigResult } from "../types/CreateConfigResult.js"
import { createUserAmneziawgConfigService } from "./createUserAmneziawgConfigService.js"

export async function createUserConfigService(
  userId: string,
  input: UpsertConfig,
): Promise<CreateConfigResult> {
  const endpoint = await findActiveEndpointById(db, input.endpointId)
  if (!endpoint) return { ok: false, reason: "endpoint_invalid" }

  const deviceType = await findDeviceTypeById(db, input.deviceTypeId)
  if (!deviceType) return { ok: false, reason: "device_type_invalid" }

  switch (endpoint.protocolTypeCode) {
    case AMNEZIAWG_PROTOCOL_CODE:
      return createUserAmneziawgConfigService(userId, input, endpoint)
    default:
      return { ok: false, reason: "unsupported_protocol" }
  }
}
