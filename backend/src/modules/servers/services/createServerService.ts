import type { UpsertServer, Server } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findServerById } from "../repository/findServerById.js"
import { insertEndpoints } from "../repository/insertEndpoints.js"
import { insertServer } from "../repository/insertServer.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

export async function createServerService(input: UpsertServer): Promise<Server> {
  return db.transaction(async (tx) => {
    const [row] = await insertServer(tx, {
      name: input.name,
      domainName: input.domainName || input.ip,
      ip: input.ip,
      country: input.country,
      status: "provisioning",
    })
    await insertEndpoints(tx, row.id, input.endpoints ?? [])
    const rows = await findServerById(row.id, tx)
    return ServerSchema.parse(createServersFromDatabaseData(rows)[0])
  })
}
