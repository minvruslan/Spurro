import type { User, UpsertUser } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import {
  getUserConfigLimitsService,
  setUserConfigLimitsService,
} from "@/api/modules/config-limit/index.js"
import { updateUser } from "../queries/updateUser.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

type ErrorCode = "not_found"

export async function updateUserService(
  id: string,
  input: UpsertUser,
): Promise<ServiceResult<{ user: User }, ErrorCode>> {
  return db.transaction(async (tx) => {
    const [updated] = await updateUser(tx, id, { name: input.name })
    if (!updated) return { ok: false, errorCode: "not_found" }
    await setUserConfigLimitsService(id, input.limits ?? [], tx)
    const limitsResult = await getUserConfigLimitsService(id, tx)
    return {
      ok: true,
      data: {
        user: UserSchema.parse({
          ...createUserFromDatabaseData(updated),
          limits: limitsResult.data.configLimits,
        }),
      },
    }
  })
}
