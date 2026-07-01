import { eq, inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint, server } from "@/core/database/schemas/domainSchema.js"

export async function softDeleteServer(executor: DbOrTx, serverId: string) {
  const endpointIds = executor
    .select({ id: endpoint.id })
    .from(endpoint)
    .where(eq(endpoint.serverId, serverId))

  await executor
    .update(config)
    .set({ status: "deleted" })
    .where(inArray(config.endpointId, endpointIds))

  await executor.update(endpoint).set({ status: "deleted" }).where(eq(endpoint.serverId, serverId))
  await executor.update(server).set({ status: "deleted" }).where(eq(server.id, serverId))
}
