import type { ConfigStatus } from "@spurro/api-contract"
import { and, eq, inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function deleteUserConfigs(
  executor: DbOrTx,
  userId: string,
  configIds: string[],
  fromStatus: ConfigStatus,
) {
  return executor
    .delete(config)
    .where(
      and(inArray(config.id, configIds), eq(config.userId, userId), eq(config.status, fromStatus)),
    )
    .returning({ id: config.id })
}
