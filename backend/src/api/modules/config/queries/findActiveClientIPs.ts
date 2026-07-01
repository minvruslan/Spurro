import { and, eq, sql } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint } from "@/core/database/schemas/domainSchema.js"

export async function findActiveClientIPs(
  executor: DbOrTx,
  serverId: string,
): Promise<(string | null)[]> {
  const rows = await executor
    .select({ ip: sql<string | null>`${config.data} ->> 'ip'` })
    .from(config)
    .innerJoin(endpoint, eq(config.endpointId, endpoint.id))
    .where(and(eq(endpoint.serverId, serverId), eq(config.status, "active")))
  return rows.map((row) => row.ip)
}
