import type { UpsertServerEndpoint } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint } from "@/core/database/schemas/domainSchema.js"

export async function insertEndpoints(
  executor: DbOrTx,
  serverId: string,
  endpoints: UpsertServerEndpoint[],
) {
  if (endpoints.length === 0) return
  await executor.insert(endpoint).values(
    endpoints.map((item) => ({
      serverId,
      protocolId: item.protocolId,
      port: item.port,
      data: {},
    })),
  )
}
