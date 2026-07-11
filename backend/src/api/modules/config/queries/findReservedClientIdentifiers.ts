import { and, eq, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint } from "@/core/database/schemas/domainSchema.js"

export async function findReservedClientIdentifiers(
  executor: DbOrTx,
  serverId: string,
): Promise<(string | null)[]> {
  const rows = await executor
    .select({ clientIdentifier: config.clientIdentifier })
    .from(config)
    .innerJoin(endpoint, eq(config.endpointId, endpoint.id))
    .where(and(eq(endpoint.serverId, serverId), ne(config.status, "deleted")))
  return rows.map((row) => row.clientIdentifier)
}
