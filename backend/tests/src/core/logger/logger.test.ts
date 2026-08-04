import type { LoggerOptions } from "pino"
import { pino } from "pino"
import { afterEach, describe, expect, it, vi } from "vitest"

const SECRET_VALUE = "must-never-reach-the-log"

const SECRET_FIELD_NAMES = [
  "clientConfiguration",
  "privateKey",
  "presharedKey",
  "publicKey",
  "password",
  "serverAccess",
]

async function importPinoOptions() {
  vi.resetModules()
  const pinoMock = vi.fn((options: Record<string, unknown>) => ({ child: vi.fn(), options }))
  vi.doMock("pino", async (importOriginal) => ({
    ...(await importOriginal<typeof import("pino")>()),
    pino: pinoMock,
  }))
  await import("@/core/logger/logger.js")
  return pinoMock.mock.calls[0][0]
}

async function createLoggerCapturingLines() {
  const { redact, serializers } = (await importPinoOptions()) as LoggerOptions
  const lines: Record<string, unknown>[] = []
  const destination = {
    write(line: string) {
      lines.push(JSON.parse(line))
    },
  }
  return { lines, logger: pino({ redact, serializers }, destination) }
}

describe("logger", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.doUnmock("pino")
    vi.resetModules()
  })

  it("takes its level from LOG_LEVEL", async () => {
    vi.stubEnv("LOG_LEVEL", "warn")

    const pinoOptions = await importPinoOptions()

    expect(pinoOptions.level).toBe("warn")
  })

  it("falls back to the info level when LOG_LEVEL is unset", async () => {
    vi.stubEnv("LOG_LEVEL", undefined)

    const pinoOptions = await importPinoOptions()

    expect(pinoOptions.level).toBe("info")
  })

  it("uses no transport in production", async () => {
    vi.stubEnv("NODE_ENV", "production")

    const pinoOptions = await importPinoOptions()

    expect(pinoOptions.transport).toBeUndefined()
  })

  it("pretty-prints outside production", async () => {
    vi.stubEnv("NODE_ENV", "development")

    const pinoOptions = await importPinoOptions()

    expect(pinoOptions.transport).toEqual({ target: "pino-pretty" })
  })

  it.each(SECRET_FIELD_NAMES)("hides a top-level %s from the log output", async (secretField) => {
    const { lines, logger } = await createLoggerCapturingLines()

    logger.info({ [secretField]: SECRET_VALUE }, "Message.")

    expect(lines[0][secretField]).toBe("[Redacted]")
    expect(JSON.stringify(lines[0])).not.toContain(SECRET_VALUE)
  })

  it.each(SECRET_FIELD_NAMES)("hides a nested %s from the log output", async (secretField) => {
    const { lines, logger } = await createLoggerCapturingLines()

    logger.info({ credentials: { [secretField]: SECRET_VALUE } }, "Message.")

    expect(JSON.stringify(lines[0])).not.toContain(SECRET_VALUE)
  })

  it("serializes a logged error with its message and stack", async () => {
    const { lines, logger } = await createLoggerCapturingLines()

    logger.error({ error: new Error("Boom.") }, "Message.")

    const loggedError = lines[0].error as Record<string, unknown>
    expect(loggedError.message).toBe("Boom.")
    expect(String(loggedError.stack)).toContain("Boom.")
  })

  it("leaves non-secret fields untouched", async () => {
    const { lines, logger } = await createLoggerCapturingLines()

    logger.info({ serverId: "server-1", password: SECRET_VALUE }, "Message.")

    expect(lines[0].serverId).toBe("server-1")
    expect(lines[0].msg).toBe("Message.")
  })
})
