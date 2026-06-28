import type { User } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { getConfigLimitsByUsersService } from "@/modules/common/config-limit/index.js"
import { findUsers } from "../queries/findUsers.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function getUsersService(): Promise<User[]> {
  const rows = await findUsers(db)
  const limitsByUser = await getConfigLimitsByUsersService(rows.map((row) => row.id))
  const users = rows.map((row) => ({
    ...createUserFromDatabaseData(row),
    limits: limitsByUser.get(row.id) ?? [],
  }))
  return UserSchema.array().parse(users)
}
