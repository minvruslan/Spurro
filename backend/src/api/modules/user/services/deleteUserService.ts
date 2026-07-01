import { db } from "@/core/database/index.js"
import { deleteUser } from "../queries/deleteUser.js"

type DeleteUserResult = { ok: true } | { ok: false; reason: "not_found" }

export async function deleteUserService(id: string): Promise<DeleteUserResult> {
  const [deleted] = await deleteUser(db, id)
  if (!deleted) return { ok: false, reason: "not_found" }
  return { ok: true }
}
