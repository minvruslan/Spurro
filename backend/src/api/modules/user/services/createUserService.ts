import { DrizzleQueryError } from "drizzle-orm"
import postgres from "postgres"
import type { User, UpsertUser } from "@vancloak/api-contract"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import {
  getUserConfigLimitsService,
  setUserConfigLimitsService,
} from "@/api/modules/config-limit/index.js"
import { insertUser } from "../queries/insertUser.js"
import { createUserFromDatabaseData } from "../utils/createUserFromDatabaseData.js"

type ErrorCode = "email_taken"

export async function createUserService(
  input: UpsertUser,
): Promise<ServiceResult<{ user: User }, ErrorCode>> {
  try {
    return await db.transaction(async (tx) => {
      const [created] = await insertUser(tx, { name: input.name, email: input.email.toLowerCase() })
      await setUserConfigLimitsService(created.id, input.limits ?? [], tx)
      const limitsResult = await getUserConfigLimitsService(created.id, tx)
      return {
        ok: true,
        data: {
          user: {
            ...createUserFromDatabaseData(created),
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
