import type { ConfigLimit } from "@spurro/shared"
import { ConfigLimitSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { DbOrTx } from "@/core/database/index.js"
import { findConfigLimits } from "../queries/findConfigLimits.js"
import { countConfigsByProtocolType } from "../queries/countConfigsByProtocolType.js"
import { createConfigLimitFromDatabaseData } from "../utils/createConfigLimitFromDatabaseData.js"

export async function getConfigLimitsService(
  userId: string,
  executor: DbOrTx = db,
): Promise<ConfigLimit[]> {
  const [limitRows, usageRows] = await Promise.all([
    findConfigLimits(executor, userId),
    countConfigsByProtocolType(executor, userId),
  ])

  const usedByType = new Map(usageRows.map((u) => [u.protocolTypeId, u.used]))

  return ConfigLimitSchema.array().parse(
    limitRows.map((row) =>
      createConfigLimitFromDatabaseData(row, usedByType.get(row.protocolTypeId) ?? 0),
    ),
  )
}
