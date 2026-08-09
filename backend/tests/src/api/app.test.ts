import { describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { findActiveDeviceTypes } from "@/api/modules/device-type/queries/findActiveDeviceTypes.js"
import { authServer } from "@/core/auth-server/index.js"
import { apiLogger } from "@/core/logger/index.js"
import { insertTestSession, insertTestUser } from "@tests/helpers/index.js"

vi.mock("@/api/modules/device-type/queries/findActiveDeviceTypes.js", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/api/modules/device-type/queries/findActiveDeviceTypes.js")
    >()
  return { findActiveDeviceTypes: vi.fn(original.findActiveDeviceTypes) }
})

describe("app", () => {
  it("serves the health check", async () => {
    const response = await app.request("/health")

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: "ok" })
  })

  it("responds with 404 for an unmatched api path", async () => {
    const response = await app.request("/api/unmatched-path")

    expect(response.status).toBe(404)
  })

  it("responds with 404 for a better-auth admin route even under an admin session", async () => {
    const headers = await insertTestSession(await insertTestUser({ role: "admin" }))

    const getResponse = await app.request("/api/auth/admin/list-users", { headers })
    const postResponse = await app.request("/api/auth/admin/set-role", { method: "POST", headers })

    expect(getResponse.status).toBe(404)
    expect(postResponse.status).toBe(404)
  })

  it("turns an unhandled error into a 500 without leaking its message", async () => {
    const errorSpy = vi.spyOn(apiLogger, "error")
    vi.spyOn(authServer, "handler").mockImplementationOnce(() => {
      throw new Error("Unhandled auth failure")
    })

    const response = await app.request("/api/auth/get-session")

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body).toEqual({ error: "Internal server error" })
    expect(JSON.stringify(body)).not.toContain("Unhandled auth failure")
    expect(
      errorSpy.mock.calls.filter(([, message]) => message === "Unhandled error."),
    ).toHaveLength(1)
  })

  it("logs a client failure as a warning, not an error", async () => {
    const warnSpy = vi.spyOn(apiLogger, "warn")
    const errorSpy = vi.spyOn(apiLogger, "error")

    const response = await app.request("/api/device-types")

    expect(response.status).toBe(401)
    expect(warnSpy.mock.calls.filter(([, message]) => message === "Request failed.")).toHaveLength(
      1,
    )
    expect(errorSpy.mock.calls.filter(([, message]) => message === "Request failed.")).toHaveLength(
      0,
    )
  })

  it("logs the cause of a failed route request", async () => {
    const errorSpy = vi.spyOn(apiLogger, "error")
    const queryFailureCause = new Error("Connection refused")
    vi.mocked(findActiveDeviceTypes).mockRejectedValueOnce(
      new Error("Query failed", { cause: queryFailureCause }),
    )
    const headers = await insertTestSession(await insertTestUser())

    const response = await app.request("/api/device-types", { headers })

    expect(response.status).toBe(500)
    const requestFailedCalls = errorSpy.mock.calls.filter(
      ([, message]) => message === "Request failed.",
    )
    expect(requestFailedCalls).toHaveLength(1)
    expect(requestFailedCalls[0][0]).toMatchObject({ cause: queryFailureCause })
  })

  it("logs a route rejection that is not an Error without a cause", async () => {
    const warnSpy = vi.spyOn(apiLogger, "warn")
    const errorSpy = vi.spyOn(apiLogger, "error")
    vi.mocked(findActiveDeviceTypes).mockRejectedValueOnce("plain string failure")
    const headers = await insertTestSession(await insertTestUser())

    const response = await app.request("/api/device-types", { headers })

    expect(response.status).toBe(500)
    const requestFailedCalls = errorSpy.mock.calls.filter(
      ([, message]) => message === "Request failed.",
    )
    expect(requestFailedCalls).toHaveLength(1)
    expect(requestFailedCalls[0][0]).toMatchObject({
      error: "plain string failure",
      cause: undefined,
    })
    expect(warnSpy.mock.calls.filter(([, message]) => message === "Request failed.")).toHaveLength(
      0,
    )
  })
})
