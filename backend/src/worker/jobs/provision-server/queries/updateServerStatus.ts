import type { ServerStatus } from "@spurro/shared"
import { and, eq, ne } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"

export async function updateServerStatus(serverId: string, status: ServerStatus) {
  return db
    .update(server)
    .set({ status })
    .where(and(eq(server.id, serverId), ne(server.status, "deleted")))
}
