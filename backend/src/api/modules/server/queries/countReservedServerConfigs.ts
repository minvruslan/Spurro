import { and, count, eq, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint } from "@/core/database/schemas/domainSchema.js"

export async function countReservedServerConfigs(executor: DbOrTx, serverId: string) {
  const [row] = await executor
    .select({ value: count() })
    .from(config)
    .innerJoin(endpoint, eq(config.endpointId, endpoint.id))
    .where(and(eq(endpoint.serverId, serverId), ne(config.status, "deleted")))
  /* v8 ignore start */
  if (!row) return 0
  /* v8 ignore stop */
  return row.value
}
