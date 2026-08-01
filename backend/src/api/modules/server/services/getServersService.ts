import type { Server } from "@spurro/api-contract"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findServers } from "../queries/findServers.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

export async function getServersService(): Promise<ServiceResult<{ servers: Server[] }>> {
  const rows = await findServers(db)
  return {
    ok: true,
    data: { servers: createServersFromDatabaseData(rows) },
  }
}
