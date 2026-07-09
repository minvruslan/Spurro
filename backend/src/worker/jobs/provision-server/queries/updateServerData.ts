import { and, eq, ne } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"

export async function updateServerData(
  serverId: string,
  data: NonNullable<typeof server.$inferSelect.data>,
) {
  return db
    .update(server)
    .set({ data })
    .where(and(eq(server.id, serverId), ne(server.status, "deleted")))
}
