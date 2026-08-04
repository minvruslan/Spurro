import { afterEach, describe, expect, it, vi } from "vitest"
import { decryptString, encryptString } from "@/core/crypto/index.js"

const OTHER_ENCRYPTION_KEY = Buffer.alloc(32, "other").toString("base64")

function replacePayloadByte(ciphertext: string, byteIndexFromEnd: number) {
  const [version, initializationVector, payloadEncoded] = ciphertext.split(":")
  const payload = Buffer.from(payloadEncoded, "base64")
  const byteIndex = payload.length - byteIndexFromEnd
  payload[byteIndex] = payload[byteIndex] ^ 0xff
  return `${version}:${initializationVector}:${payload.toString("base64")}`
}

describe("decryptString", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("decrypts a ciphertext frozen in the current at-rest format", () => {
    const frozenCiphertext =
      "v1:9wGxUO11PG/XaZXQ:KSTyoqLaymYwU6uw+I94vi16FuFDioDjM37GeWmaUvHXbqJNlr4KDNB9sws="

    expect(decryptString(frozenCiphertext)).toBe("spurro-at-rest-golden-vector")
  })

  it("rejects a ciphertext with an unsupported version prefix", () => {
    const ciphertext = encryptString("secret value").replace(/^v1:/, "v2:")

    expect(() => decryptString(ciphertext)).toThrow("Unsupported ciphertext format")
  })

  it("rejects a ciphertext with fewer than three parts", () => {
    expect(() => decryptString("v1:onlyonepart")).toThrow("Unsupported ciphertext format")
  })

  it("rejects a ciphertext with more than three parts", () => {
    expect(() => decryptString(`${encryptString("secret value")}:extra`)).toThrow(
      "Unsupported ciphertext format",
    )
  })

  it("rejects a ciphertext with an empty initialization vector", () => {
    const [, , payloadEncoded] = encryptString("secret value").split(":")

    expect(() => decryptString(`v1::${payloadEncoded}`)).toThrow("Unsupported ciphertext format")
  })

  it("rejects a ciphertext with an empty payload", () => {
    const [, initializationVector] = encryptString("secret value").split(":")

    expect(() => decryptString(`v1:${initializationVector}:`)).toThrow(
      "Unsupported ciphertext format",
    )
  })

  it("rejects a plaintext value that was never encrypted", () => {
    expect(() => decryptString("10.8.0.2")).toThrow("Unsupported ciphertext format")
  })

  it("rejects a payload shorter than the auth tag", () => {
    const [, initializationVector] = encryptString("secret value").split(":")
    const shortPayload = Buffer.alloc(15).toString("base64")

    expect(() => decryptString(`v1:${initializationVector}:${shortPayload}`)).toThrow(
      "Ciphertext payload is shorter than the auth tag",
    )
  })

  it("rejects a ciphertext whose encrypted body was tampered with", () => {
    const ciphertext = encryptString("secret value")

    expect(() => decryptString(replacePayloadByte(ciphertext, 17))).toThrow()
  })

  it("rejects a ciphertext whose auth tag was tampered with", () => {
    const ciphertext = encryptString("secret value")

    expect(() => decryptString(replacePayloadByte(ciphertext, 1))).toThrow()
  })

  it("rejects a ciphertext whose initialization vector was tampered with", () => {
    const [version, initializationVectorEncoded, payloadEncoded] =
      encryptString("secret value").split(":")
    const initializationVector = Buffer.from(initializationVectorEncoded, "base64")
    initializationVector[0] = initializationVector[0] ^ 0xff

    expect(() =>
      decryptString(`${version}:${initializationVector.toString("base64")}:${payloadEncoded}`),
    ).toThrow()
  })

  it("rejects a ciphertext encrypted with a different key", async () => {
    const ciphertext = encryptString("secret value")
    vi.stubEnv("APP_ENCRYPTION_KEY", OTHER_ENCRYPTION_KEY)
    vi.resetModules()
    const { decryptString: decryptWithOtherKey } = await import("@/core/crypto/index.js")

    expect(() => decryptWithOtherKey(ciphertext)).toThrow()
  })
})
