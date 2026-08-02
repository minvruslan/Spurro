import { describe, expect, it } from "vitest"
import { env } from "@/core/env/index.js"
import { TEST_DATABASE_URL } from "../constants/TEST_DATABASE_URL.js"

describe("setupTestEnvironment", () => {
  it("points DATABASE_URL at the test database", () => {
    expect(env.DATABASE_URL).toBe(TEST_DATABASE_URL)
  })

  it("uses a 32-byte test encryption key", () => {
    expect(Buffer.from(env.APP_ENCRYPTION_KEY, "base64")).toHaveLength(32)
  })
})
