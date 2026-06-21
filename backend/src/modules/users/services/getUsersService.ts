import type { User } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { getConfigLimitsByUsersService } from "@/modules/configs/services/getConfigLimitsByUsersService.js"
import { findUsers } from "../repository/findUsers.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function getUsersService(): Promise<User[]> {
  const rows = await findUsers()
  const limitsByUser = await getConfigLimitsByUsersService(rows.map((row) => row.id))
  const users = rows.map((row) => ({
    ...createUserFromDatabaseData(row),
    limits: limitsByUser.get(row.id) ?? [],
  }))
  return UserSchema.array().parse(users)
}
