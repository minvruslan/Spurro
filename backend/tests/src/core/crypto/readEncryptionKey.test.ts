import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const INVALID_KEY_MESSAGE = "APP_ENCRYPTION_KEY must be 32 bytes encoded as base64"

async function importReadEncryptionKey() {
  vi.resetModules()
  const { readEncryptionKey } = await import("@/core/crypto/readEncryptionKey.js")
  return readEncryptionKey
}

describe("readEncryptionKey", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("returns the 32-byte key decoded from APP_ENCRYPTION_KEY", async () => {
    const readEncryptionKey = await importReadEncryptionKey()

    const key = readEncryptionKey()

    expect(key).toHaveLength(32)
    expect(key.toString("base64")).toBe(process.env.APP_ENCRYPTION_KEY)
  })

  it("keeps the key it read first when the environment changes afterwards", async () => {
    const readEncryptionKey = await importReadEncryptionKey()
    const key = readEncryptionKey()
    vi.stubEnv("APP_ENCRYPTION_KEY", Buffer.alloc(32, "other").toString("base64"))

    expect(readEncryptionKey()).toBe(key)
  })

  it("throws when APP_ENCRYPTION_KEY is not set", async () => {
    vi.stubEnv("APP_ENCRYPTION_KEY", undefined)
    const readEncryptionKey = await importReadEncryptionKey()

    expect(readEncryptionKey).toThrow(INVALID_KEY_MESSAGE)
  })

  it("throws when APP_ENCRYPTION_KEY decodes to fewer than 32 bytes", async () => {
    vi.stubEnv("APP_ENCRYPTION_KEY", Buffer.alloc(31, "short").toString("base64"))
    const readEncryptionKey = await importReadEncryptionKey()

    expect(readEncryptionKey).toThrow(INVALID_KEY_MESSAGE)
  })

  it("throws when APP_ENCRYPTION_KEY decodes to more than 32 bytes", async () => {
    vi.stubEnv("APP_ENCRYPTION_KEY", Buffer.alloc(33, "long").toString("base64"))
    const readEncryptionKey = await importReadEncryptionKey()

    expect(readEncryptionKey).toThrow(INVALID_KEY_MESSAGE)
  })
})
