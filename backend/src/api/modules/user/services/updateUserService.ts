import { DrizzleQueryError } from "drizzle-orm"
import postgres from "postgres"
import type { User, UpsertUser } from "@spurro/api-contract"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import {
  getUserConfigLimitsService,
  setUserConfigLimitsService,
} from "@/api/modules/config-limit/index.js"
import { updateUser } from "../queries/updateUser.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

type ErrorCode = "not_found" | "email_taken"

export async function updateUserService(
  id: string,
  input: UpsertUser,
): Promise<ServiceResult<{ user: User }, ErrorCode>> {
  try {
    return await db.transaction(async (tx) => {
      const [updated] = await updateUser(tx, id, { name: input.name, email: input.email })
      if (!updated) return { ok: false, errorCode: "not_found" }
      await setUserConfigLimitsService(id, input.limits ?? [], tx)
      const limitsResult = await getUserConfigLimitsService(id, tx)
      return {
        ok: true,
        data: {
          user: {
            ...createUserFromDatabaseData(updated),
            limits: limitsResult.data.configLimits,
          },
        },
      }
    })
  } catch (error) {
    const cause = error instanceof DrizzleQueryError ? error.cause : error
    if (
      cause instanceof postgres.PostgresError &&
      cause.code === "23505" &&
      cause.constraint_name === "user_email_unique"
    ) {
      return { ok: false, errorCode: "email_taken", error }
    }
    throw error
  }
}
