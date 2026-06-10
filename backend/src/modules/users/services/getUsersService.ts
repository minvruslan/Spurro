import type { User } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { findUsers } from "../repository/findUsers.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function getUsersService(): Promise<User[]> {
  const rows = await findUsers()
  return UserSchema.array().parse(rows.map(createUserFromDatabaseData))
}
