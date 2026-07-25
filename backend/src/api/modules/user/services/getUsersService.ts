import type { User } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { getUsersConfigLimitsService } from "@/api/modules/config-limit/index.js"
import { findUsers } from "../queries/findUsers.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

export async function getUsersService(): Promise<ServiceResult<{ users: User[] }>> {
  const rows = await findUsers(db)
  const limitsResult = await getUsersConfigLimitsService(rows.map((row) => row.id))
  const users = rows.map((row) => ({
    ...createUserFromDatabaseData(row),
    limits: limitsResult.data.configLimitsByUserId.get(row.id) ?? [],
  }))
  return { ok: true, data: { users: UserSchema.array().parse(users) } }
}
