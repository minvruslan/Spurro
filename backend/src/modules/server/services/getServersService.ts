import type { Server } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findServers } from "../queries/findServers.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

export async function getServersService(): Promise<Server[]> {
  const rows = await findServers(db)
  return ServerSchema.array().parse(createServersFromDatabaseData(rows))
}
