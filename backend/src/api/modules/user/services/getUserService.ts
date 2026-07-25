import type { User } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { getUserConfigLimitsService } from "@/api/modules/config-limit/index.js"
import { findUserById } from "../queries/findUserById.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

type ErrorCode = "not_found"

export async function getUserService(
  id: string,
): Promise<ServiceResult<{ user: User }, ErrorCode>> {
  const [row] = await findUserById(db, id)
  if (!row) return { ok: false, reason: "not_found" }
  const limitsResult = await getUserConfigLimitsService(id)
  return {
    ok: true,
    data: {
      user: UserSchema.parse({
        ...createUserFromDatabaseData(row),
        limits: limitsResult.data.configLimits,
      }),
    },
  }
}
