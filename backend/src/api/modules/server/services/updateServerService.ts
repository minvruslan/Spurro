import type { Server, UpsertServer } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findServerById } from "../queries/findServerById.js"
import { updateServer } from "../queries/updateServer.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

type ErrorCode = "not_found"

export async function updateServerService(
  id: string,
  input: UpsertServer,
): Promise<ServiceResult<{ server: Server }, ErrorCode>> {
  const [row] = await updateServer(db, id, { name: input.name, country: input.country })
  if (!row) return { ok: false, reason: "not_found" }
  const rows = await findServerById(db, row.id)
  return { ok: true, data: { server: ServerSchema.parse(createServersFromDatabaseData(rows)[0]) } }
}
