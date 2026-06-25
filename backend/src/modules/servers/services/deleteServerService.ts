import { db } from "@/core/database/index.js"
import { countServerGrants } from "../repository/countServerGrants.js"
import { deleteServer } from "../repository/deleteServer.js"
import { findServerById } from "../repository/findServerById.js"
import { softDeleteServer } from "../repository/softDeleteServer.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

type DeleteServerResult = { ok: true } | { ok: false; reason: "not_found" | "current" }

export async function deleteServerService(id: string): Promise<DeleteServerResult> {
  const rows = await findServerById(db, id)
  if (rows.length === 0) return { ok: false, reason: "not_found" }

  const server = createServersFromDatabaseData(rows)[0]
  if (server.status === "deleted") return { ok: false, reason: "not_found" }
  if (server.isCurrent) return { ok: false, reason: "current" }

  const grants = await countServerGrants(db, id)
  if (grants === 0) {
    await deleteServer(db, id)
  } else {
    await db.transaction(async (tx) => {
      await softDeleteServer(tx, id)
    })
  }

  return { ok: true }
}
