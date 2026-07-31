import { sql } from "drizzle-orm"
import { deleteUserConfigsService } from "@/api/modules/config/index.js"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { countUserConfigsRequiringCleanup } from "../queries/countUserConfigsRequiringCleanup.js"
import { deleteUser } from "../queries/deleteUser.js"
import { findUserById } from "../queries/findUserById.js"

type ErrorCode = "not_found" | "config_delete_failed" | "configs_appeared"

export async function deleteUserService(id: string): Promise<ServiceResult<null, ErrorCode>> {
  const [user] = await findUserById(db, id)

  if (!user) return { ok: false, errorCode: "not_found" }

  const deleteUserConfigsResult = await deleteUserConfigsService(id)
  if (!deleteUserConfigsResult.ok) {
    return { ok: false, errorCode: "config_delete_failed", error: deleteUserConfigsResult.error }
  }
  if (deleteUserConfigsResult.data.deleteFailedConfigIds.length > 0) {
    return {
      ok: false,
      errorCode: "config_delete_failed",
      error: new Error(
        `Failed to delete configs [${deleteUserConfigsResult.data.deleteFailedConfigIds.join(", ")}] of user ${id}; user not deleted.`,
      ),
    }
  }

  const deleteUserResult = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`)

    const requiringCleanup = await countUserConfigsRequiringCleanup(tx, id)
    if (requiringCleanup > 0) return "configs_appeared" as const

    const [deleted] = await deleteUser(tx, id)
    return deleted ? ("deleted" as const) : ("not_found" as const)
  })

  if (deleteUserResult === "configs_appeared") {
    return {
      ok: false,
      errorCode: "configs_appeared",
      error: new Error(`User ${id} got new configs while being deleted; user not deleted.`),
    }
  }

  if (deleteUserResult === "not_found") return { ok: false, errorCode: "not_found" }

  return { ok: true, data: null }
}
