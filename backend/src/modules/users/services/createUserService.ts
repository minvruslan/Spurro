import type { User, UpsertUser } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import {
  getConfigLimitsService,
  setConfigLimitsService,
} from "@/modules/common/config-limits/index.js"
import { insertUser } from "../repository/insertUser.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function createUserService(input: UpsertUser): Promise<User> {
  return db.transaction(async (tx) => {
    const [created] = await insertUser(tx, { name: input.name, email: input.email })
    await setConfigLimitsService(created.id, input.limits ?? [], tx)
    const limits = await getConfigLimitsService(created.id, tx)
    return UserSchema.parse({ ...createUserFromDatabaseData(created), limits })
  })
}
