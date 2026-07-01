import type { User, UpsertUser } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import {
  getUserConfigLimitsService,
  setUserConfigLimitsService,
} from "@/api/modules/common/config-limit/index.js"
import { insertUser } from "../queries/insertUser.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function createUserService(input: UpsertUser): Promise<User> {
  return db.transaction(async (tx) => {
    const [created] = await insertUser(tx, { name: input.name, email: input.email })
    await setUserConfigLimitsService(created.id, input.limits ?? [], tx)
    const limits = await getUserConfigLimitsService(created.id, tx)
    return UserSchema.parse({ ...createUserFromDatabaseData(created), limits })
  })
}
