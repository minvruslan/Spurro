import { and, eq, ne } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"

export async function findServer(serverId: string) {
  const [row] = await db
    .select({
      ip: server.ip,
      domainName: server.domainName,
      data: server.data,
    })
    .from(server)
    .where(and(eq(server.id, serverId), ne(server.status, "deleted")))
    .limit(1)

  return row
}
