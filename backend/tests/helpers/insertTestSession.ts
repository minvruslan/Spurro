import { randomUUID } from "node:crypto"
import { makeSignature } from "better-auth/crypto"
import { authServer } from "@/core/auth-server/index.js"
import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { session, user } from "@/core/database/schemas/index.js"

export async function insertTestSession(
  sessionUser: typeof user.$inferSelect,
  overrides: Partial<typeof session.$inferInsert> = {},
  executor: DbOrTx = db,
) {
  const authContext = await authServer.$context
  const token = randomUUID()
  await executor.insert(session).values({
    id: `test-session-${token}`,
    token,
    userId: sessionUser.id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    updatedAt: new Date(),
    ...overrides,
  })
  const signedToken = `${token}.${await makeSignature(token, authContext.secret)}`
  return new Headers({ cookie: `${authContext.authCookies.sessionToken.name}=${signedToken}` })
}
