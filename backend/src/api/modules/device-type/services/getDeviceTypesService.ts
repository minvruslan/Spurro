import type { DeviceType } from "@spurro/api-contract"
import { DeviceTypeSchema } from "@spurro/api-contract"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findActiveDeviceTypes } from "../queries/findActiveDeviceTypes.js"

export async function getDeviceTypesService(): Promise<
  ServiceResult<{ deviceTypes: DeviceType[] }>
> {
  const rows = await findActiveDeviceTypes(db)
  return { ok: true, data: { deviceTypes: DeviceTypeSchema.array().parse(rows) } }
}
