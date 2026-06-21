import type { User, UpsertUser } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { getConfigLimitsService } from "@/modules/configs/services/getConfigLimitsService.js"
import { insertUser } from "../repository/insertUser.js"
import { insertUserLimits } from "../repository/insertUserLimits.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function createUserService(input: UpsertUser): Promise<User> {
  const row = await db.transaction(async (tx) => {
    const [created] = await insertUser(tx, { name: input.name, email: input.email })
    await insertUserLimits(tx, created.id, input.limits ?? [])
    return created
  })
  const limits = await getConfigLimitsService(row.id)
  return UserSchema.parse({ ...createUserFromDatabaseData(row), limits })
}
