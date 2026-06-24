import type { User, UpsertUser } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { getConfigLimitsService } from "@/modules/configs/services/getConfigLimitsService.js"
import { insertUser } from "../repository/insertUser.js"
import { insertUserLimits } from "../repository/insertUserLimits.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function createUserService(input: UpsertUser): Promise<User> {
  return db.transaction(async (tx) => {
    const [created] = await insertUser(tx, { name: input.name, email: input.email })
    await insertUserLimits(tx, created.id, input.limits ?? [])
    const limits = await getConfigLimitsService(created.id, tx)
    return UserSchema.parse({ ...createUserFromDatabaseData(created), limits })
  })
}
