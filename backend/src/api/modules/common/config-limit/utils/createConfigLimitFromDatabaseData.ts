import type { ConfigLimit } from "@spurro/shared"
import type { findUserConfigLimits } from "../queries/findUserConfigLimits.js"

type ConfigLimitRow = Awaited<ReturnType<typeof findUserConfigLimits>>[number]

export function createConfigLimitFromDatabaseData(row: ConfigLimitRow, used: number): ConfigLimit {
  return {
    id: row.id,
    protocolType: {
      id: row.protocolTypeId,
      code: row.protocolTypeCode,
      name: row.protocolTypeName,
    },
    maxCount: row.maxCount,
    used,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
