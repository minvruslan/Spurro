import type { Server } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { findServers } from "../repository/findServers.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

export async function getServersService(): Promise<Server[]> {
  const rows = await findServers()
  return ServerSchema.array().parse(createServersFromDatabaseData(rows))
}
