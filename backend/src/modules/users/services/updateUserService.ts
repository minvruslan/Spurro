import type { User, UpsertUser } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { getConfigLimitsService } from "@/modules/configs/services/getConfigLimitsService.js"
import { updateUser } from "../repository/updateUser.js"
import { updateUserLimits } from "../repository/updateUserLimits.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function updateUserService(id: string, input: UpsertUser): Promise<User | null> {
  return db.transaction(async (tx) => {
    const [updated] = await updateUser(tx, id, { name: input.name })
    if (!updated) return null
    await updateUserLimits(tx, id, input.limits ?? [])
    const limits = await getConfigLimitsService(id, tx)
    return UserSchema.parse({ ...createUserFromDatabaseData(updated), limits })
  })
}
