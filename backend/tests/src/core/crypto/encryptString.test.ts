import { describe, expect, it } from "vitest"
import { decryptString, encryptString } from "@/core/crypto/index.js"

describe("encryptString", () => {
  it("returns a v1 ciphertext of three colon-separated parts", () => {
    const ciphertext = encryptString("secret value")

    const parts = ciphertext.split(":")
    expect(parts).toHaveLength(3)
    expect(parts[0]).toBe("v1")
    expect(Buffer.from(parts[1], "base64")).toHaveLength(12)
    expect(parts[2]).not.toBe("")
  })

  it("returns a ciphertext that does not contain the plaintext", () => {
    const plaintext = "super-secret-preshared-key"

    expect(encryptString(plaintext)).not.toContain(plaintext)
  })

  it("produces a different ciphertext for the same plaintext on every call", () => {
    const plaintext = "secret value"

    const firstCiphertext = encryptString(plaintext)
    const secondCiphertext = encryptString(plaintext)

    expect(firstCiphertext).not.toBe(secondCiphertext)
    expect(firstCiphertext.split(":")[1]).not.toBe(secondCiphertext.split(":")[1])
  })

  it("round-trips an ascii string", () => {
    const plaintext = "10.8.0.2"

    expect(decryptString(encryptString(plaintext))).toBe(plaintext)
  })

  it("round-trips an empty string", () => {
    expect(decryptString(encryptString(""))).toBe("")
  })

  it("round-trips unicode text", () => {
    const plaintext = "Сервер «Амстердам» — 🇳🇱 узел"

    expect(decryptString(encryptString(plaintext))).toBe(plaintext)
  })

  it("round-trips a string containing colons", () => {
    const plaintext = "v1:not:a:real:ciphertext"

    expect(decryptString(encryptString(plaintext))).toBe(plaintext)
  })

  it("round-trips a large json payload", () => {
    const plaintext = JSON.stringify({
      facts: { sshHostKeys: Array.from({ length: 200 }, (_, index) => `ssh-ed25519 KEY${index}`) },
    })

    expect(decryptString(encryptString(plaintext))).toBe(plaintext)
  })
})
