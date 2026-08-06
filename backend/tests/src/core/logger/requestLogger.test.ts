import { describe, expect, it, vi } from "vitest"
import app from "@/api/app.js"
import { apiLogger } from "@/core/logger/index.js"

describe("requestLogger", () => {
  it("logs the method, path and status of a served request", async () => {
    const infoSpy = vi.spyOn(apiLogger, "info")

    await app.request("/health")

    const requestLogCalls = infoSpy.mock.calls.filter(
      ([, message]) => message === "GET /health 200",
    )
    expect(requestLogCalls).toHaveLength(1)
    expect(requestLogCalls[0][0]).toMatchObject({ method: "GET", path: "/health", status: 200 })
  })

  it("logs a non-negative request duration", async () => {
    const infoSpy = vi.spyOn(apiLogger, "info")

    await app.request("/health")

    const [requestLogCall] = infoSpy.mock.calls.filter(
      ([, message]) => message === "GET /health 200",
    )
    const { durationMilliseconds } = requestLogCall[0] as { durationMilliseconds: number }
    expect(durationMilliseconds).toBeGreaterThanOrEqual(0)
  })
})
