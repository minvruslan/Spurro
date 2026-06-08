import type { Config } from "@spurro/shared"
import { findConfigs } from "../repository/findConfigs.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

export async function getConfigsService(userId: string): Promise<Config[]> {
  const rows = await findConfigs(userId)
  return rows.map(createConfigFromDatabaseData)
}
