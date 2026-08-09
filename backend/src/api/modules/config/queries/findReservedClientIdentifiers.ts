import { eq } from "drizzle-orm"
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
    .where(eq(endpoint.serverId, serverId))
  return rows.map((row) => row.clientIdentifier)
}
