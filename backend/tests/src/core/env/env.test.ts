import { afterEach, describe, expect, it, vi } from "vitest"

async function importEnvModule(dotenvValues: Record<string, string> = {}) {
  vi.resetModules()
  vi.doMock("dotenv", () => ({
    config: () => {
      Object.assign(process.env, dotenvValues)
      return { parsed: dotenvValues }
    },
  }))
  const { startupLogger } = await import("@/core/logger/index.js")
  const errorSpy = vi.spyOn(startupLogger, "error").mockImplementation(() => undefined)
  const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as unknown as never)
  const { env } = await import("@/core/env/env.js")
  return { env, errorSpy, exitSpy }
}

describe("env", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.doUnmock("dotenv")
    vi.resetModules()
  })

  it("loads dotenv values into the environment before parsing", async () => {
    vi.stubEnv("HOST", undefined)

    const { env, exitSpy } = await importEnvModule({ HOST: "from-dotenv" })

    expect(env.HOST).toBe("from-dotenv")
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it("applies the schema defaults for variables the environment omits", async () => {
    vi.stubEnv("PORT", undefined)
    vi.stubEnv("HOST", undefined)

    const { env, exitSpy } = await importEnvModule()

    expect(env.PORT).toBe(4000)
    expect(env.HOST).toBe("localhost")
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it("exits with code 1 when the environment is invalid", async () => {
    vi.stubEnv("IP", "not-an-ip")

    const { exitSpy } = await importEnvModule()

    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it("logs the validation failure before exiting", async () => {
    vi.stubEnv("ADMIN_EMAIL", "not-an-email")

    const { errorSpy } = await importEnvModule()

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(String(errorSpy.mock.calls[0][0])).toContain("Invalid environment:")
    expect(String(errorSpy.mock.calls[0][0])).toContain("ADMIN_EMAIL")
  })
})
