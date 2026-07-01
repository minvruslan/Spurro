import type { Config } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findUserConfig } from "../queries/findUserConfig.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

export async function getUserConfigService(
  userId: string,
  configId: string,
): Promise<Config | null> {
  const rows = await findUserConfig(db, userId, configId)
  if (rows.length === 0) return null
  return ConfigSchema.parse(createConfigFromDatabaseData(rows[0]))
}
