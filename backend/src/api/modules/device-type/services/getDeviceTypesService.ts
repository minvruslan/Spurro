import type { DeviceType } from "@spurro/shared"
import { DeviceTypeSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findDeviceTypes } from "../queries/findDeviceTypes.js"

export async function getDeviceTypesService(): Promise<DeviceType[]> {
  const rows = await findDeviceTypes(db)
  return DeviceTypeSchema.array().parse(rows)
}
