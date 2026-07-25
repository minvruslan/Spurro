import type { Server } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findServerById } from "../queries/findServerById.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

type ErrorCode = "not_found"

export async function getServerService(
  id: string,
): Promise<ServiceResult<{ server: Server }, ErrorCode>> {
  const rows = await findServerById(db, id)
  if (rows.length === 0) return { ok: false, reason: "not_found" }
  const server = createServersFromDatabaseData(rows)[0]
  if (server.status === "deleted") return { ok: false, reason: "not_found" }
  return { ok: true, data: { server: ServerSchema.parse(server) } }
}
