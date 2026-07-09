import type { ConfigStatus } from "@spurro/shared"
import { and, eq, inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function setUserConfigsStatus(
  executor: DbOrTx,
  userId: string,
  configIds: string[],
  status: ConfigStatus,
  fromStatus?: ConfigStatus,
) {
  return executor
    .update(config)
    .set({ status })
    .where(
      and(
        inArray(config.id, configIds),
        eq(config.userId, userId),
        ...(fromStatus ? [eq(config.status, fromStatus)] : []),
      ),
    )
    .returning({ id: config.id })
}
