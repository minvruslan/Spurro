import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { bootstrapAdmin } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/index.js"
import { env } from "@/core/env/index.js"
import { insertTestUser } from "@tests/helpers/index.js"

describe("bootstrapAdmin", () => {
  it("creates an admin user for ADMIN_EMAIL", async () => {
    await bootstrapAdmin()

    const userRows = await db.select().from(user).where(eq(user.email, env.ADMIN_EMAIL))
    expect(userRows).toHaveLength(1)
    expect(userRows[0].role).toBe("admin")
    expect(userRows[0].name).toBe(env.ADMIN_NAME)
    expect(userRows[0].emailVerified).toBe(true)
  })

  it("stores the email lowercased when ADMIN_EMAIL has mixed case", async () => {
    const originalAdminEmail = env.ADMIN_EMAIL
    env.ADMIN_EMAIL = "Admin@Test.Local"
    try {
      await bootstrapAdmin()

      const userRows = await db.select().from(user)
      expect(userRows).toHaveLength(1)
      expect(userRows[0].email).toBe("admin@test.local")
      expect(userRows[0].role).toBe("admin")
    } finally {
      env.ADMIN_EMAIL = originalAdminEmail
    }
  })

  it("inserts nothing when a lowercase row already exists for a mixed-case ADMIN_EMAIL", async () => {
    const existingUser = await insertTestUser({ email: env.ADMIN_EMAIL })
    const originalAdminEmail = env.ADMIN_EMAIL
    env.ADMIN_EMAIL = "Admin@Test.Local"
    try {
      await bootstrapAdmin()

      const userRows = await db.select().from(user)
      expect(userRows).toEqual([existingUser])
    } finally {
      env.ADMIN_EMAIL = originalAdminEmail
    }
  })

  it("inserts nothing when an existing row differs from ADMIN_EMAIL only in case", async () => {
    const existingUser = await insertTestUser({ email: env.ADMIN_EMAIL.toUpperCase() })

    await bootstrapAdmin()

    const userRows = await db.select().from(user)
    expect(userRows).toEqual([existingUser])
  })

  it("creates no second user when run twice", async () => {
    await bootstrapAdmin()
    const [createdAdmin] = await db.select().from(user).where(eq(user.email, env.ADMIN_EMAIL))

    await bootstrapAdmin()

    const userRows = await db.select().from(user)
    expect(userRows).toHaveLength(1)
    expect(userRows[0].id).toBe(createdAdmin.id)
  })

  it("leaves an existing user with the admin email unchanged", async () => {
    const existingUser = await insertTestUser({ email: env.ADMIN_EMAIL, name: "Existing" })

    await bootstrapAdmin()

    const userRows = await db.select().from(user).where(eq(user.email, env.ADMIN_EMAIL))
    expect(userRows).toEqual([existingUser])
  })

  it("leaves other users untouched", async () => {
    const otherUser = await insertTestUser()

    await bootstrapAdmin()

    const otherUserRows = await db.select().from(user).where(eq(user.id, otherUser.id))
    expect(otherUserRows).toEqual([otherUser])
  })
})
