import type { UpsertServer, Server } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import {
  PROVISION_SERVER_JOB_NAME,
  provisionServerQueue,
} from "@/core/queue/provision-server/index.js"
import { deleteServer } from "../queries/deleteServer.js"
import { findServerById } from "../queries/findServerById.js"
import { insertEndpoints } from "../queries/insertEndpoints.js"
import { insertServer } from "../queries/insertServer.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

export async function createServerService(input: UpsertServer): Promise<Server> {
  const result = await db.transaction(async (tx) => {
    const [row] = await insertServer(tx, {
      name: input.name,
      domainName: input.domainName || input.ip,
      ip: input.ip,
      country: input.country,
      status: "provisioning",
    })
    await insertEndpoints(tx, row.id, input.endpoints ?? [])
    const rows = await findServerById(tx, row.id)
    return ServerSchema.parse(createServersFromDatabaseData(rows)[0])
  })

  try {
    await provisionServerQueue().add(PROVISION_SERVER_JOB_NAME, { serverId: result.id })
  } catch (error) {
    await deleteServer(db, result.id).catch((rollbackError) =>
      console.error("[createServer] rollback failed", result.id, rollbackError),
    )
    throw error
  }

  return result
}
