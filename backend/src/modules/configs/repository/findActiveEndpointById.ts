import { and, eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint, server } from "@/core/database/schema.js"

export async function findActiveEndpointById(executor: DbOrTx, id: string) {
  const [row] = await executor
    .select({ id: endpoint.id })
    .from(endpoint)
    .innerJoin(server, eq(endpoint.serverId, server.id))
    .where(and(eq(endpoint.id, id), eq(endpoint.status, "active"), eq(server.status, "active")))
    .limit(1)
  return row
}
