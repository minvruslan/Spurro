import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { insertTestSession } from "./insertTestSession.js"
import { insertTestUser } from "./insertTestUser.js"

export async function signInTestAdmin(executor: DbOrTx = db) {
  const adminUser = await insertTestUser({ role: "admin" }, executor)
  return insertTestSession(adminUser, {}, executor)
}
