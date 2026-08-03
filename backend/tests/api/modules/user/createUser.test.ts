import { call } from "@orpc/server"
import { UserSchema, type UpsertUser } from "@spurro/api-contract"
import { eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { userRouter } from "@/api/modules/user/index.js"
import { insertUser } from "@/api/modules/user/queries/insertUser.js"
import { db } from "@/core/database/index.js"
import { configLimit, user } from "@/core/database/schemas/index.js"
import { expectOrpcError } from "../../../assertions/index.js"
import {
  createTestEmail,
  insertTestConfigLimit,
  insertTestSession,
  insertTestUser,
  signInTestAdmin,
} from "../../../helpers/index.js"

vi.mock("@/api/modules/user/queries/insertUser.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/api/modules/user/queries/insertUser.js")>()
  return { insertUser: vi.fn(original.insertUser) }
})

function callCreateUser(input: unknown, headers: Headers) {
  return call(userRouter.createUser, input as UpsertUser, { context: { headers } })
}

describe("POST /users", () => {
  it("creates a user and returns it matching the contract schema with status 201", async () => {
    const email = createTestEmail()
    const headers = await signInTestAdmin()
    headers.set("content-type", "application/json")

    const response = await app.request("/api/users", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Created User", email }),
    })

    expect(response.status).toBe(201)
    const parsed = UserSchema.parse(await response.json())
    expect(parsed.name).toBe("Created User")
    expect(parsed.email).toBe(email)
  })

  it("exposes exactly the contract fields and nothing more at every nesting level", async () => {
    const createdUser = await callCreateUser(
      {
        name: "Created User",
        email: createTestEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 2 }],
      },
      await signInTestAdmin(),
    )

    expect(Object.keys(createdUser).sort()).toEqual([
      "banReason",
      "banned",
      "createdAt",
      "email",
      "id",
      "limits",
      "name",
      "role",
    ])
    expect(createdUser.limits).toHaveLength(1)
    for (const limit of createdUser.limits) {
      expect(Object.keys(limit).sort()).toEqual([
        "createdAt",
        "id",
        "maxCount",
        "protocolFamily",
        "updatedAt",
        "used",
      ])
    }
  })

  it("persists the created user in the database", async () => {
    const email = createTestEmail()
    const createdUser = await callCreateUser(
      { name: "Created User", email },
      await signInTestAdmin(),
    )

    const userRows = await db.select().from(user).where(eq(user.id, createdUser.id))
    expect(userRows).toHaveLength(1)
    expect(userRows[0].name).toBe("Created User")
    expect(userRows[0].email).toBe(email)
    expect(userRows[0].emailVerified).toBe(true)
  })

  it("returns the created user with no role and not banned", async () => {
    const createdUser = await callCreateUser(
      { name: "Created User", email: createTestEmail() },
      await signInTestAdmin(),
    )

    const parsed = UserSchema.parse(createdUser)
    expect(parsed.role).toBeNull()
    expect(parsed.banned).toBe(false)
  })

  it("creates config limits from the provided limits and returns them with used 0", async () => {
    const createdUser = await callCreateUser(
      {
        name: "Created User",
        email: createTestEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 4 }],
      },
      await signInTestAdmin(),
    )

    const parsed = UserSchema.parse(createdUser)
    expect(parsed.limits).toHaveLength(1)
    for (const limit of parsed.limits) {
      expect(limit.protocolFamily).toBe("amneziawg")
      expect(limit.maxCount).toBe(4)
      expect(limit.used).toBe(0)
    }
  })

  it("persists the config limit rows for the created user", async () => {
    const createdUser = await callCreateUser(
      {
        name: "Created User",
        email: createTestEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 4 }],
      },
      await signInTestAdmin(),
    )

    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, createdUser.id))
    expect(configLimitRows).toHaveLength(1)
    expect(configLimitRows[0].protocolFamily).toBe("amneziawg")
    expect(configLimitRows[0].maxCount).toBe(4)
  })

  it("leaves another user's config limit untouched", async () => {
    const bystanderUser = await insertTestUser()
    const bystanderConfigLimit = await insertTestConfigLimit({
      userId: bystanderUser.id,
      maxCount: 6,
    })

    await callCreateUser(
      {
        name: "Created User",
        email: createTestEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 4 }],
      },
      await signInTestAdmin(),
    )

    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, bystanderUser.id))
    expect(configLimitRows).toEqual([bystanderConfigLimit])
  })

  it("creates the user with an empty limits array when limits is omitted", async () => {
    const createdUser = await callCreateUser(
      { name: "Created User", email: createTestEmail() },
      await signInTestAdmin(),
    )

    expect(createdUser.limits).toEqual([])
  })

  it("creates the user with an empty limits array when limits is an empty array", async () => {
    const createdUser = await callCreateUser(
      { name: "Created User", email: createTestEmail(), limits: [] },
      await signInTestAdmin(),
    )

    expect(createdUser.limits).toEqual([])
  })

  it("rejects a missing name", async () => {
    await expectOrpcError(
      callCreateUser({ email: createTestEmail() }, await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects an empty name", async () => {
    await expectOrpcError(
      callCreateUser({ name: "", email: createTestEmail() }, await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects a name longer than 255 characters", async () => {
    await expectOrpcError(
      callCreateUser({ name: "a".repeat(256), email: createTestEmail() }, await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("accepts a name of exactly 255 characters", async () => {
    const name = "a".repeat(255)
    const createdUser = await callCreateUser(
      { name, email: createTestEmail() },
      await signInTestAdmin(),
    )

    expect(createdUser.name).toBe(name)
  })

  it("rejects a name of a wrong type", async () => {
    await expectOrpcError(
      callCreateUser({ name: 123, email: createTestEmail() }, await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects a missing email", async () => {
    await expectOrpcError(
      callCreateUser({ name: "Created User" }, await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects a malformed email", async () => {
    await expectOrpcError(
      callCreateUser({ name: "Created User", email: "not-an-email" }, await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("rejects an email longer than 255 characters", async () => {
    const email = `${"a".repeat(250)}@test.local`
    await expectOrpcError(
      callCreateUser({ name: "Created User", email }, await signInTestAdmin()),
      "BAD_REQUEST",
    )
  })

  it("ignores unknown extra fields in the payload", async () => {
    const email = createTestEmail()
    const createdUser = await callCreateUser(
      { name: "Created User", email, unknownField: "ignored" },
      await signInTestAdmin(),
    )

    const parsed = UserSchema.parse(createdUser)
    expect(parsed.email).toBe(email)
    expect(createdUser).not.toHaveProperty("unknownField")
  })

  it("rejects limits containing a duplicate protocol family", async () => {
    await expectOrpcError(
      callCreateUser(
        {
          name: "Created User",
          email: createTestEmail(),
          limits: [
            { protocolFamily: "amneziawg", maxCount: 1 },
            { protocolFamily: "amneziawg", maxCount: 2 },
          ],
        },
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects a limit with a negative maxCount", async () => {
    await expectOrpcError(
      callCreateUser(
        {
          name: "Created User",
          email: createTestEmail(),
          limits: [{ protocolFamily: "amneziawg", maxCount: -1 }],
        },
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("accepts a limit with maxCount of exactly 0", async () => {
    const createdUser = await callCreateUser(
      {
        name: "Created User",
        email: createTestEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 0 }],
      },
      await signInTestAdmin(),
    )

    expect(createdUser.limits).toHaveLength(1)
    for (const limit of createdUser.limits) {
      expect(limit.maxCount).toBe(0)
    }
  })

  it("rejects a limit with a non-integer maxCount", async () => {
    await expectOrpcError(
      callCreateUser(
        {
          name: "Created User",
          email: createTestEmail(),
          limits: [{ protocolFamily: "amneziawg", maxCount: 1.5 }],
        },
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects a limit with an unknown protocol family", async () => {
    await expectOrpcError(
      callCreateUser(
        {
          name: "Created User",
          email: createTestEmail(),
          limits: [{ protocolFamily: "wireguard", maxCount: 1 }],
        },
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )
  })

  it("rejects a duplicate email with EMAIL_TAKEN", async () => {
    const existingUser = await insertTestUser()

    await expectOrpcError(
      callCreateUser({ name: "Created User", email: existingUser.email }, await signInTestAdmin()),
      "EMAIL_TAKEN",
    )
  })

  it("rejects a duplicate email differing only in case with EMAIL_TAKEN", async () => {
    const existingUser = await insertTestUser()

    await expectOrpcError(
      callCreateUser(
        { name: "Created User", email: existingUser.email.toUpperCase() },
        await signInTestAdmin(),
      ),
      "EMAIL_TAKEN",
    )
  })

  it("rejects a duplicate email with EMAIL_TAKEN even when the existing user is banned", async () => {
    const existingUser = await insertTestUser({ banned: true, banReason: "Violation of terms" })

    await expectOrpcError(
      callCreateUser({ name: "Created User", email: existingUser.email }, await signInTestAdmin()),
      "EMAIL_TAKEN",
    )
  })

  it("does not insert a user row when the email is taken", async () => {
    const existingUser = await insertTestUser()

    await callCreateUser(
      { name: "Created User", email: existingUser.email },
      await signInTestAdmin(),
    ).catch(() => undefined)

    const userRows = await db.select().from(user).where(eq(user.email, existingUser.email))
    expect(userRows).toHaveLength(1)
    expect(userRows[0].id).toBe(existingUser.id)
  })

  it("responds with HTTP 409 when the email is taken", async () => {
    const existingUser = await insertTestUser()
    const headers = await signInTestAdmin()
    headers.set("content-type", "application/json")

    const response = await app.request("/api/users", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Created User", email: existingUser.email }),
    })

    expect(response.status).toBe(409)
  })

  it("does not insert user or config limit rows when input validation fails", async () => {
    const email = createTestEmail()

    await expectOrpcError(
      callCreateUser(
        { name: "", email, limits: [{ protocolFamily: "amneziawg", maxCount: 5 }] },
        await signInTestAdmin(),
      ),
      "BAD_REQUEST",
    )

    const userRows = await db.select().from(user).where(eq(user.email, email))
    expect(userRows).toHaveLength(0)
  })

  it("rejects an ordinary user with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    await expectOrpcError(
      callCreateUser({ name: "Created User", email: createTestEmail() }, headers),
      "FORBIDDEN",
    )
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expectOrpcError(
      callCreateUser({ name: "Created User", email: createTestEmail() }, new Headers()),
      "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the user insert throws", async () => {
      vi.mocked(insertUser).mockRejectedValueOnce(new Error("Insert failure"))
      const headers = await signInTestAdmin()
      headers.set("content-type", "application/json")

      const response = await app.request("/api/users", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Created User", email: createTestEmail() }),
      })
      expect(response.status).toBe(500)
    })
  })
})
