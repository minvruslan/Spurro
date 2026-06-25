import { count, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { accessGrant, endpoint } from "@/core/database/schema.js"

export async function countServerGrants(executor: DbOrTx, serverId: string) {
  const [row] = await executor
    .select({ value: count() })
    .from(accessGrant)
    .innerJoin(endpoint, eq(accessGrant.endpointId, endpoint.id))
    .where(eq(endpoint.serverId, serverId))
  return row?.value ?? 0
}
