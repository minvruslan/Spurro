import type { Config } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findUserConfig } from "../queries/findUserConfig.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

type ErrorCode = "not_found"

export async function getUserConfigService(
  userId: string,
  configId: string,
): Promise<ServiceResult<{ config: Config }, ErrorCode>> {
  const rows = await findUserConfig(db, userId, configId)
  if (rows.length === 0) return { ok: false, reason: "not_found" }
  return { ok: true, data: { config: ConfigSchema.parse(createConfigFromDatabaseData(rows[0])) } }
}
