import { eq, inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { accessGrant, endpoint, server } from "@/core/database/schemas/domainSchema.js"

export async function softDeleteServer(executor: DbOrTx, id: string) {
  const endpointIds = executor
    .select({ id: endpoint.id })
    .from(endpoint)
    .where(eq(endpoint.serverId, id))

  await executor
    .update(accessGrant)
    .set({ status: "deleted" })
    .where(inArray(accessGrant.endpointId, endpointIds))

  await executor.update(endpoint).set({ status: "deleted" }).where(eq(endpoint.serverId, id))
  await executor.update(server).set({ status: "deleted" }).where(eq(server.id, id))
}
