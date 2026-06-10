import type { ConfigLimit } from "@spurro/shared"
import { ConfigLimitSchema } from "@spurro/shared"
import { findConfigLimits } from "../repository/findConfigLimits.js"
import { countConfigsByProtocolType } from "../repository/countConfigsByProtocolType.js"
import { createConfigLimitFromDatabaseData } from "../utils/createConfigLimitFromDatabaseData.js"

export async function getConfigLimitsService(userId: string): Promise<ConfigLimit[]> {
  const [limitRows, usageRows] = await Promise.all([
    findConfigLimits(userId),
    countConfigsByProtocolType(userId),
  ])

  const usedByType = new Map(usageRows.map((u) => [u.protocolTypeId, u.used]))

  return ConfigLimitSchema.array().parse(
    limitRows.map((row) =>
      createConfigLimitFromDatabaseData(row, usedByType.get(row.protocolTypeId) ?? 0),
    ),
  )
}
