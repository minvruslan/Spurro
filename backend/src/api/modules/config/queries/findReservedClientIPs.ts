import { and, eq, ne, sql } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint } from "@/core/database/schemas/domainSchema.js"

export async function findReservedClientIPs(
  executor: DbOrTx,
  serverId: string,
): Promise<(string | null)[]> {
  const rows = await executor
    .select({ ip: sql<string | null>`${config.data} ->> 'ip'` })
    .from(config)
    .innerJoin(endpoint, eq(config.endpointId, endpoint.id))
    .where(and(eq(endpoint.serverId, serverId), ne(config.status, "deleted")))
  return rows.map((row) => row.ip)
}
