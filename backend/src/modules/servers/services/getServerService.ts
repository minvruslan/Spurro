import type { Server } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { findServerById } from "../repository/findServerById.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

export async function getServerService(id: string): Promise<Server | null> {
  const rows = await findServerById(id)
  if (rows.length === 0) return null
  return ServerSchema.parse(createServersFromDatabaseData(rows)[0])
}
