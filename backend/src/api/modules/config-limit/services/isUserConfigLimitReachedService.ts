import type { SupportedProtocolFamily } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { countReservedUserConfigs } from "../queries/countReservedUserConfigs.js"
import { findUserConfigLimitByProtocolFamily } from "../queries/findUserConfigLimitByProtocolFamily.js"

export async function isUserConfigLimitReachedService(
  executor: DbOrTx,
  userId: string,
  protocolFamily: SupportedProtocolFamily,
): Promise<boolean> {
  const limit = await findUserConfigLimitByProtocolFamily(executor, userId, protocolFamily)
  if (!limit) return false

  const reserved = await countReservedUserConfigs(executor, userId, protocolFamily)
  return reserved >= limit.maxCount
}
