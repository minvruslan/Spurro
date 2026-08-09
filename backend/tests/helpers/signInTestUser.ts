import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { insertTestSession } from "./insertTestSession.js"
import { insertTestUser } from "./insertTestUser.js"

export async function signInTestUser(executor: DbOrTx = db) {
  const sessionUser = await insertTestUser({}, executor)
  return insertTestSession(sessionUser, {}, executor)
}
