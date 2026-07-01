import type { User, UpsertUser } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import {
  getUserConfigLimitsService,
  setUserConfigLimitsService,
} from "@/api/modules/common/config-limit/index.js"
import { updateUser } from "../queries/updateUser.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function updateUserService(id: string, input: UpsertUser): Promise<User | null> {
  return db.transaction(async (tx) => {
    const [updated] = await updateUser(tx, id, { name: input.name })
    if (!updated) return null
    await setUserConfigLimitsService(id, input.limits ?? [], tx)
    const limits = await getUserConfigLimitsService(id, tx)
    return UserSchema.parse({ ...createUserFromDatabaseData(updated), limits })
  })
}
