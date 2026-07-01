import { eq } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"

export async function deleteServer(executor: DbOrTx, serverId: string) {
  return executor.delete(server).where(eq(server.id, serverId)).returning({ id: server.id })
}
