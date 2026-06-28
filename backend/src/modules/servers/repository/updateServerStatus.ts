import { and, eq, ne } from "drizzle-orm"
import type { ServerStatus } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"

export async function updateServerStatus(executor: DbOrTx, id: string, status: ServerStatus) {
  return executor
    .update(server)
    .set({ status })
    .where(and(eq(server.id, id), ne(server.status, "deleted")))
    .returning({ id: server.id })
}
