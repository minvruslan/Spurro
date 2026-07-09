import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { endpoint } from "@/core/database/schemas/domainSchema.js"

export async function findEndpointData(executor: DbOrTx, endpointId: string) {
  const [row] = await executor
    .select({ data: endpoint.data })
    .from(endpoint)
    .where(eq(endpoint.id, endpointId))
    .limit(1)
  return row
}
