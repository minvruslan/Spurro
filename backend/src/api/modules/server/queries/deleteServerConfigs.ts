import { eq, inArray } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { config, endpoint } from "@/core/database/schemas/domainSchema.js"

export async function deleteServerConfigs(executor: DbOrTx, serverId: string) {
  const endpointIds = executor
    .select({ id: endpoint.id })
    .from(endpoint)
    .where(eq(endpoint.serverId, serverId))

  await executor.delete(config).where(inArray(config.endpointId, endpointIds))
}
