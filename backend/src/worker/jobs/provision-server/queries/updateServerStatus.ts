import type { ServerStatus } from "@spurro/api-contract"
import { eq } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"

export async function updateServerStatus(serverId: string, status: ServerStatus) {
  return db.update(server).set({ status }).where(eq(server.id, serverId))
}
