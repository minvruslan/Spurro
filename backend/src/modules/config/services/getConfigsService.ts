import type { Config } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findConfigs } from "../queries/findConfigs.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

export async function getConfigsService(userId: string): Promise<Config[]> {
  const rows = await findConfigs(db, userId)
  return ConfigSchema.array().parse(rows.map(createConfigFromDatabaseData))
}
