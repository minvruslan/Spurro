import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"

export async function findServerAccess(executor: DbOrTx, serverId: string) {
  const [row] = await executor
    .select({ ip: server.ip, data: server.data })
    .from(server)
    .where(eq(server.id, serverId))
    .limit(1)
  return row
}
