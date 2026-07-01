import { and, eq, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"

export async function updateServer(
  executor: DbOrTx,
  serverId: string,
  fields: { name: string; country: string },
) {
  return executor
    .update(server)
    .set({ name: fields.name, country: fields.country })
    .where(and(eq(server.id, serverId), ne(server.status, "deleted")))
    .returning({ id: server.id })
}
