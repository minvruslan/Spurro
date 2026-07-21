import { sql } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { countReservedServerConfigs } from "../queries/countReservedServerConfigs.js"
import { deleteServer } from "../queries/deleteServer.js"
import { deleteServerConfigs } from "../queries/deleteServerConfigs.js"
import { findServerById } from "../queries/findServerById.js"
import { softDeleteServer } from "../queries/softDeleteServer.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

type DeleteServerResult = { ok: true } | { ok: false; reason: "not_found" | "current" }

export async function deleteServerService(id: string): Promise<DeleteServerResult> {
  const rows = await findServerById(db, id)
  if (rows.length === 0) return { ok: false, reason: "not_found" }

  const server = createServersFromDatabaseData(rows)[0]
  if (server.status === "deleted") return { ok: false, reason: "not_found" }
  if (server.isCurrent) return { ok: false, reason: "current" }

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`)

    const reserved = await countReservedServerConfigs(tx, id)
    if (reserved === 0) {
      await deleteServerConfigs(tx, id)
      await deleteServer(tx, id)
    } else {
      await softDeleteServer(tx, id)
    }
  })

  return { ok: true }
}
