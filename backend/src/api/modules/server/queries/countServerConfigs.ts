import { count, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint } from "@/core/database/schemas/domainSchema.js"

export async function countServerConfigs(executor: DbOrTx, serverId: string) {
  const [row] = await executor
    .select({ value: count() })
    .from(config)
    .innerJoin(endpoint, eq(config.endpointId, endpoint.id))
    .where(eq(endpoint.serverId, serverId))
  return row?.value ?? 0
}
