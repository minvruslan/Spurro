import type { User } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { getConfigLimitsService } from "@/modules/configs/services/getConfigLimitsService.js"
import { findUserById } from "../repository/findUserById.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function getUserService(id: string): Promise<User | null> {
  const [row] = await findUserById(db, id)
  if (!row) return null
  const limits = await getConfigLimitsService(id)
  return UserSchema.parse({ ...createUserFromDatabaseData(row), limits })
}
