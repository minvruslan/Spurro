import type { SupportedProtocolCode, UpsertConfig } from "@spurro/shared"
import { SupportedProtocolCodeSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findActiveEndpointById } from "../queries/findActiveEndpointById.js"
import { findDeviceTypeById } from "../queries/findDeviceTypeById.js"
import type { CreateConfigResult } from "../types/CreateConfigResult.js"
import { createUserAmneziawg2ConfigService } from "./createUserAmneziawg2ConfigService.js"

type ActiveEndpoint = NonNullable<Awaited<ReturnType<typeof findActiveEndpointById>>>

const createUserConfigServiceBySupportedProtocolCode: Record<
  SupportedProtocolCode,
  (userId: string, input: UpsertConfig, endpoint: ActiveEndpoint) => Promise<CreateConfigResult>
> = {
  amneziawg2: createUserAmneziawg2ConfigService,
}

export async function createUserConfigService(
  userId: string,
  input: UpsertConfig,
): Promise<CreateConfigResult> {
  const endpoint = await findActiveEndpointById(db, input.endpointId)
  if (!endpoint) return { ok: false, reason: "endpoint_invalid" }

  const deviceType = await findDeviceTypeById(db, input.deviceTypeId)
  if (!deviceType) return { ok: false, reason: "device_type_invalid" }

  const parsedCode = SupportedProtocolCodeSchema.safeParse(endpoint.protocolCode)
  if (!parsedCode.success) return { ok: false, reason: "unsupported_protocol" }

  return createUserConfigServiceBySupportedProtocolCode[parsedCode.data](userId, input, endpoint)
}
