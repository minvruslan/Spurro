import { eq } from "drizzle-orm"
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
    .where(eq(server.id, id))
    .returning({ id: server.id })
}
