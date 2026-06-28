import { db } from "@/core/database/index.js"
import { deleteConfig } from "../queries/deleteConfig.js"

export async function deleteConfigService(userId: string, id: string): Promise<boolean> {
  const [row] = await deleteConfig(db, userId, id)
  return Boolean(row)
}
