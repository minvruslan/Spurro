import type { Server, UpsertServer } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findServerById } from "../repository/findServerById.js"
import { updateServer } from "../repository/updateServer.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

export async function updateServerService(id: string, input: UpsertServer): Promise<Server | null> {
  const [row] = await updateServer(db, id, { name: input.name, country: input.country })
  if (!row) return null
  const rows = await findServerById(db, row.id)
  return ServerSchema.parse(createServersFromDatabaseData(rows)[0])
}
