import { describe, expect, it } from "vitest"
import { env } from "@/core/env/index.js"
import { TEST_DATABASE_URL } from "@tests/constants/TEST_DATABASE_URL.js"
import { TEST_QUEUE_URL } from "@tests/constants/TEST_QUEUE_URL.js"

describe("setupTestEnvironment", () => {
  it("points DATABASE_URL at the test database", () => {
    expect(env.DATABASE_URL).toBe(TEST_DATABASE_URL)
  })

  it("points QUEUE_URL at the test redis", () => {
    expect(env.QUEUE_URL).toBe(TEST_QUEUE_URL)
  })

  it("uses a 32-byte test encryption key", () => {
    expect(Buffer.from(env.APP_ENCRYPTION_KEY, "base64")).toHaveLength(32)
  })

  it("pins PORT, HOST and ADMIN_NAME against values leaking from a developer's .env", () => {
    expect(env.PORT).toBe(4000)
    expect(env.HOST).toBe("localhost")
    expect(env.ADMIN_NAME).toBe("Test Admin")
  })
})
