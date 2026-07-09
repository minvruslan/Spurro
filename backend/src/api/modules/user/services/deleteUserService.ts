import {
  deleteUserConfigsService,
  findDeletableUserConfigIds,
} from "@/api/modules/common/config/index.js"
import { db } from "@/core/database/index.js"
import { deleteUser } from "../queries/deleteUser.js"
import { findUserById } from "../queries/findUserById.js"

type DeleteUserResult = { ok: true } | { ok: false; reason: "not_found" | "config_delete_failed" }

export async function deleteUserService(id: string): Promise<DeleteUserResult> {
  const [user] = await findUserById(db, id)

  if (!user) return { ok: false, reason: "not_found" }

  const configs = await findDeletableUserConfigIds(db, id)

  if (configs.length > 0) {
    const result = await deleteUserConfigsService(
      id,
      configs.map((config) => config.id),
    )
    if (!result.ok) return { ok: false, reason: "config_delete_failed" }
  }

  const [deleted] = await deleteUser(db, id)

  if (!deleted) return { ok: false, reason: "not_found" }

  return { ok: true }
}
