import type { ConfigLimit } from "@spurro/shared"
import { ConfigLimitSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { DbOrTx } from "@/core/database/index.js"
import { findUserConfigLimits } from "../queries/findUserConfigLimits.js"
import { countUserConfigsByProtocolType } from "../queries/countUserConfigsByProtocolType.js"
import { createConfigLimitFromDatabaseData } from "../utils/createConfigLimitFromDatabaseData.js"

export async function getUserConfigLimitsService(
  userId: string,
  executor: DbOrTx = db,
): Promise<ConfigLimit[]> {
  const [limitRows, usageRows] = await Promise.all([
    findUserConfigLimits(executor, userId),
    countUserConfigsByProtocolType(executor, userId),
  ])

  const usedByType = new Map(usageRows.map((u) => [u.protocolTypeId, u.used]))

  return ConfigLimitSchema.array().parse(
    limitRows.map((row) =>
      createConfigLimitFromDatabaseData(row, usedByType.get(row.protocolTypeId) ?? 0),
    ),
  )
}
