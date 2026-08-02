import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { UserSchema, type UpsertUser } from "@spurro/api-contract"
import { eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { userRouter } from "@/api/modules/user/index.js"
import { insertUser } from "@/api/modules/user/queries/insertUser.js"
import { db } from "@/core/database/index.js"
import { configLimit, user } from "@/core/database/schemas/index.js"
import { insertTestUser, signInTestUser } from "../../../helpers/index.js"

vi.mock("@/api/modules/user/queries/insertUser.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/api/modules/user/queries/insertUser.js")>()
  return { insertUser: vi.fn(original.insertUser) }
})

const createUser = (input: unknown, headers: Headers) =>
  call(userRouter.createUser, input as UpsertUser, { context: { headers } })

async function adminHeaders() {
  const requestUser = await insertTestUser({ role: "admin" })
  return signInTestUser(requestUser)
}

function uniqueEmail() {
  return `created-user-${randomUUID()}@test.local`
}

const expectBadRequest = async (input: unknown, headers: Headers) => {
  await expect(createUser(input, headers)).rejects.toSatisfy(
    (error) => error instanceof ORPCError && error.code === "BAD_REQUEST",
  )
}

const expectEmailTaken = async (input: unknown, headers: Headers) => {
  await expect(createUser(input, headers)).rejects.toSatisfy(
    (error) => error instanceof ORPCError && error.code === "EMAIL_TAKEN",
  )
}

describe("POST /users", () => {
  it("creates a user and returns it matching the contract schema with status 201", async () => {
    const email = uniqueEmail()
    const headers = await adminHeaders()
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
    const createdUser = await createUser(
      {
        name: "Created User",
        email: uniqueEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 2 }],
      },
      await adminHeaders(),
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
    const email = uniqueEmail()
    const createdUser = await createUser({ name: "Created User", email }, await adminHeaders())

    const userRows = await db.select().from(user).where(eq(user.id, createdUser.id))
    expect(userRows).toHaveLength(1)
    expect(userRows[0].name).toBe("Created User")
    expect(userRows[0].email).toBe(email)
  })

  it("returns the created user with no role and not banned", async () => {
    const createdUser = await createUser(
      { name: "Created User", email: uniqueEmail() },
      await adminHeaders(),
    )

    const parsed = UserSchema.parse(createdUser)
    expect(parsed.role).toBeNull()
    expect(parsed.banned).toBe(false)
  })

  it("creates config limits from the provided limits and returns them with used 0", async () => {
    const createdUser = await createUser(
      {
        name: "Created User",
        email: uniqueEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 4 }],
      },
      await adminHeaders(),
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
    const createdUser = await createUser(
      {
        name: "Created User",
        email: uniqueEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 4 }],
      },
      await adminHeaders(),
    )

    const configLimitRows = await db
      .select()
      .from(configLimit)
      .where(eq(configLimit.userId, createdUser.id))
    expect(configLimitRows).toHaveLength(1)
    expect(configLimitRows[0].protocolFamily).toBe("amneziawg")
    expect(configLimitRows[0].maxCount).toBe(4)
  })

  it("creates the user with an empty limits array when limits is omitted", async () => {
    const createdUser = await createUser(
      { name: "Created User", email: uniqueEmail() },
      await adminHeaders(),
    )

    expect(createdUser.limits).toEqual([])
  })

  it("creates the user with an empty limits array when limits is an empty array", async () => {
    const createdUser = await createUser(
      { name: "Created User", email: uniqueEmail(), limits: [] },
      await adminHeaders(),
    )

    expect(createdUser.limits).toEqual([])
  })

  it("rejects a missing name", async () => {
    await expectBadRequest({ email: uniqueEmail() }, await adminHeaders())
  })

  it("rejects an empty name", async () => {
    await expectBadRequest({ name: "", email: uniqueEmail() }, await adminHeaders())
  })

  it("rejects a name longer than 255 characters", async () => {
    await expectBadRequest({ name: "a".repeat(256), email: uniqueEmail() }, await adminHeaders())
  })

  it("accepts a name of exactly 255 characters", async () => {
    const name = "a".repeat(255)
    const createdUser = await createUser({ name, email: uniqueEmail() }, await adminHeaders())

    expect(createdUser.name).toBe(name)
  })

  it("rejects a name of a wrong type", async () => {
    await expectBadRequest({ name: 123, email: uniqueEmail() }, await adminHeaders())
  })

  it("rejects a missing email", async () => {
    await expectBadRequest({ name: "Created User" }, await adminHeaders())
  })

  it("rejects a malformed email", async () => {
    await expectBadRequest({ name: "Created User", email: "not-an-email" }, await adminHeaders())
  })

  it("rejects an email longer than 255 characters", async () => {
    const email = `${"a".repeat(250)}@test.local`
    await expectBadRequest({ name: "Created User", email }, await adminHeaders())
  })

  it("ignores unknown extra fields in the payload", async () => {
    const email = uniqueEmail()
    const createdUser = await createUser(
      { name: "Created User", email, unknownField: "ignored" },
      await adminHeaders(),
    )

    const parsed = UserSchema.parse(createdUser)
    expect(parsed.email).toBe(email)
    expect(createdUser).not.toHaveProperty("unknownField")
  })

  it("rejects limits containing a duplicate protocol family", async () => {
    await expectBadRequest(
      {
        name: "Created User",
        email: uniqueEmail(),
        limits: [
          { protocolFamily: "amneziawg", maxCount: 1 },
          { protocolFamily: "amneziawg", maxCount: 2 },
        ],
      },
      await adminHeaders(),
    )
  })

  it("rejects a limit with a negative maxCount", async () => {
    await expectBadRequest(
      {
        name: "Created User",
        email: uniqueEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: -1 }],
      },
      await adminHeaders(),
    )
  })

  it("accepts a limit with maxCount of exactly 0", async () => {
    const createdUser = await createUser(
      {
        name: "Created User",
        email: uniqueEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 0 }],
      },
      await adminHeaders(),
    )

    expect(createdUser.limits).toHaveLength(1)
    for (const limit of createdUser.limits) {
      expect(limit.maxCount).toBe(0)
    }
  })

  it("rejects a limit with a non-integer maxCount", async () => {
    await expectBadRequest(
      {
        name: "Created User",
        email: uniqueEmail(),
        limits: [{ protocolFamily: "amneziawg", maxCount: 1.5 }],
      },
      await adminHeaders(),
    )
  })

  it("rejects a limit with an unknown protocol family", async () => {
    await expectBadRequest(
      {
        name: "Created User",
        email: uniqueEmail(),
        limits: [{ protocolFamily: "wireguard", maxCount: 1 }],
      },
      await adminHeaders(),
    )
  })

  it("rejects a duplicate email with EMAIL_TAKEN", async () => {
    const existingUser = await insertTestUser()

    await expectEmailTaken(
      { name: "Created User", email: existingUser.email },
      await adminHeaders(),
    )
  })

  it("rejects a duplicate email differing only in case with EMAIL_TAKEN", async () => {
    const existingUser = await insertTestUser()

    await expectEmailTaken(
      { name: "Created User", email: existingUser.email.toUpperCase() },
      await adminHeaders(),
    )
  })

  it("rejects a duplicate email with EMAIL_TAKEN even when the existing user is banned", async () => {
    const existingUser = await insertTestUser({ banned: true, banReason: "Violation of terms" })

    await expectEmailTaken(
      { name: "Created User", email: existingUser.email },
      await adminHeaders(),
    )
  })

  it("does not insert a user row when the email is taken", async () => {
    const existingUser = await insertTestUser()

    await createUser(
      { name: "Created User", email: existingUser.email },
      await adminHeaders(),
    ).catch(() => undefined)

    const userRows = await db.select().from(user).where(eq(user.email, existingUser.email))
    expect(userRows).toHaveLength(1)
    expect(userRows[0].id).toBe(existingUser.id)
  })

  it("does not insert user or config limit rows when input validation fails", async () => {
    const email = uniqueEmail()

    await expectBadRequest(
      { name: "", email, limits: [{ protocolFamily: "amneziawg", maxCount: 5 }] },
      await adminHeaders(),
    )

    const userRows = await db.select().from(user).where(eq(user.email, email))
    expect(userRows).toHaveLength(0)
  })

  it("rejects an ordinary user with FORBIDDEN", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expect(
      createUser({ name: "Created User", email: uniqueEmail() }, headers),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "FORBIDDEN")
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expect(
      createUser({ name: "Created User", email: uniqueEmail() }, new Headers()),
    ).rejects.toSatisfy((error) => error instanceof ORPCError && error.code === "UNAUTHORIZED")
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the user insert throws", async () => {
      vi.mocked(insertUser).mockRejectedValueOnce(new Error("Insert failure"))
      const headers = await adminHeaders()
      headers.set("content-type", "application/json")

      const response = await app.request("/api/users", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Created User", email: uniqueEmail() }),
      })
      expect(response.status).toBe(500)
    })
  })
})
