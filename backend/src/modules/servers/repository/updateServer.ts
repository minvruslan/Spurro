import { and, eq, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { server } from "@/core/database/schema.js"

export async function updateServer(
  executor: DbOrTx,
  id: string,
  fields: { name: string; country: string },
) {
  return executor
    .update(server)
    .set({ name: fields.name, country: fields.country })
    .where(and(eq(server.id, id), ne(server.status, "deleted")))
    .returning({ id: server.id })
}
