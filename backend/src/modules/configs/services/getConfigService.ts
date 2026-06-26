import type { Config } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findConfigByIdForUser } from "../repository/findConfigByIdForUser.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

export async function getConfigService(userId: string, id: string): Promise<Config | null> {
  const rows = await findConfigByIdForUser(db, userId, id)
  if (rows.length === 0) return null
  return ConfigSchema.parse(createConfigFromDatabaseData(rows[0]))
}
