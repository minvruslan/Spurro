import { db } from "@/core/database/index.js"
import { deleteUser } from "../repository/deleteUser.js"

export async function deleteUserService(id: string): Promise<boolean> {
  const [deleted] = await deleteUser(db, id)
  return Boolean(deleted)
}
