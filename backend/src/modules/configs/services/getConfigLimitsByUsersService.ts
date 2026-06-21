import type { ConfigLimit } from "@spurro/shared"
import { ConfigLimitSchema } from "@spurro/shared"
import { findConfigLimitsByUsers } from "../repository/findConfigLimitsByUsers.js"
import { countConfigsByProtocolTypeForUsers } from "../repository/countConfigsByProtocolTypeForUsers.js"
import { createConfigLimitFromDatabaseData } from "../utils/createConfigLimitFromDatabaseData.js"

export async function getConfigLimitsByUsersService(
  userIds: string[],
): Promise<Map<string, ConfigLimit[]>> {
  const result = new Map<string, ConfigLimit[]>()
  if (userIds.length === 0) return result

  const [limitRows, usageRows] = await Promise.all([
    findConfigLimitsByUsers(userIds),
    countConfigsByProtocolTypeForUsers(userIds),
  ])

  const usedByKey = new Map(usageRows.map((u) => [`${u.userId}:${u.protocolTypeId}`, u.used]))

  for (const row of limitRows) {
    const used = usedByKey.get(`${row.userId}:${row.protocolTypeId}`) ?? 0
    const limit = ConfigLimitSchema.parse(createConfigLimitFromDatabaseData(row, used))
    const list = result.get(row.userId) ?? []
    list.push(limit)
    result.set(row.userId, list)
  }

  return result
}
