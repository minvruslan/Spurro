import { and, eq, inArray, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

export async function findDeletableUserConfigs(
  executor: DbOrTx,
  userId: string,
  configIds?: string[],
) {
  return executor
    .select({ id: config.id, endpointId: config.endpointId, data: config.data })
    .from(config)
    .where(
      and(
        eq(config.userId, userId),
        ne(config.status, "deleted"),
        configIds ? inArray(config.id, configIds) : undefined,
      ),
    )
}

export type DeletableUserConfig = Awaited<ReturnType<typeof findDeletableUserConfigs>>[number]
