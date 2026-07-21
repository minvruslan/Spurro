import type { ConfigLimit } from "@spurro/shared"
import { ConfigLimitSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { DbOrTx } from "@/core/database/index.js"
import { findUsersConfigLimits } from "../queries/findUsersConfigLimits.js"
import { countUsersConfigsByProtocolFamily } from "../queries/countUsersConfigsByProtocolFamily.js"
import { createConfigLimitFromDatabaseData } from "../utils/createConfigLimitFromDatabaseData.js"

export async function getUsersConfigLimitsService(
  userIds: string[],
  executor: DbOrTx = db,
): Promise<Map<string, ConfigLimit[]>> {
  const result = new Map<string, ConfigLimit[]>()
  if (userIds.length === 0) return result

  const [limitRows, usageRows] = await Promise.all([
    findUsersConfigLimits(executor, userIds),
    countUsersConfigsByProtocolFamily(executor, userIds),
  ])

  const usedByKey = new Map(usageRows.map((u) => [`${u.userId}:${u.protocolFamily}`, u.used]))

  for (const row of limitRows) {
    const used = usedByKey.get(`${row.userId}:${row.protocolFamily}`) ?? 0
    const limit = ConfigLimitSchema.parse(createConfigLimitFromDatabaseData(row, used))
    const list = result.get(row.userId) ?? []
    list.push(limit)
    result.set(row.userId, list)
  }

  return result
}
