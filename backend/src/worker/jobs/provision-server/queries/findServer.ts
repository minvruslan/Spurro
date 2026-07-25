import { and, eq, ne } from "drizzle-orm"
import { ServerDataSchema } from "@spurro/infrastructure/types"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"
import { workerLogger } from "@/core/logger/index.js"

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

  if (!row) return undefined

  const parsedData = ServerDataSchema.safeParse(row.data)
  if (!parsedData.success) {
    if (row.data !== null) {
      workerLogger.warn(
        { serverId, issues: parsedData.error.issues },
        "Server data failed schema validation.",
      )
    }
    return { ip: row.ip, domainName: row.domainName, data: null }
  }

  return { ip: row.ip, domainName: row.domainName, data: parsedData.data }
}
