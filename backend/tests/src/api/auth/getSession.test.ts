import { UserSessionSchema } from "@spurro/api-contract"
import { describe, expect, it } from "vitest"
import app from "@/api/app.js"
import { insertTestSession, insertTestUser } from "@tests/helpers/index.js"

describe("GET /api/auth/get-session", () => {
  it("returns the signed-in admin matching the contract session schema with role admin", async () => {
    const requestUser = await insertTestUser({ role: "admin" })
    const headers = await insertTestSession(requestUser)

    const response = await app.request("/api/auth/get-session", { headers })

    expect(response.status).toBe(200)
    const body = await response.json()
    const parsedUser = UserSessionSchema.parse(body.user)
    expect(parsedUser.id).toBe(requestUser.id)
    expect(parsedUser.email).toBe(requestUser.email)
    expect(parsedUser.role).toBe("admin")
  })

  it("returns an ordinary user matching the contract session schema without the admin role", async () => {
    const requestUser = await insertTestUser()
    const headers = await insertTestSession(requestUser)

    const response = await app.request("/api/auth/get-session", { headers })

    expect(response.status).toBe(200)
    const body = await response.json()
    const parsedUser = UserSessionSchema.parse(body.user)
    expect(parsedUser.id).toBe(requestUser.id)
    expect(parsedUser.role).not.toBe("admin")
  })

  it("returns no user for an anonymous request", async () => {
    const response = await app.request("/api/auth/get-session")
    expect(response.status).toBe(200)
    expect(await response.json()).toBeNull()
  })
})
