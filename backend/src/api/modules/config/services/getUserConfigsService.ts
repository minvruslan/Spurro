import type { Config } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findUserConfigs } from "../queries/findUserConfigs.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

export async function getUserConfigsService(
  userId: string,
): Promise<ServiceResult<{ configs: Config[] }>> {
  const rows = await findUserConfigs(db, userId)
  return {
    ok: true,
    data: { configs: ConfigSchema.array().parse(rows.map(createConfigFromDatabaseData)) },
  }
}
