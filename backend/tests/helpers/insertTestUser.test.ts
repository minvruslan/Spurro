import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/index.js"
import { insertTestUser } from "./insertTestUser.js"

describe("insertTestUser", () => {
  it("creates a persisted user with unique id and email", async () => {
    const firstUser = await insertTestUser()
    const secondUser = await insertTestUser()
    expect(firstUser.id).not.toBe(secondUser.id)
    expect(firstUser.email).not.toBe(secondUser.email)

    const foundUsers = await db.select().from(user).where(eq(user.id, firstUser.id))
    expect(foundUsers).toHaveLength(1)
  })

  it("applies overrides", async () => {
    const insertedUser = await insertTestUser({ role: "admin" })
    expect(insertedUser.role).toBe("admin")
  })
})
