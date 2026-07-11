import { createCipheriv, randomBytes } from "node:crypto"
import { readEncryptionKey } from "./readEncryptionKey.js"

const INITIALIZATION_VECTOR_LENGTH = 12

export function encryptString(plaintext: string): string {
  const initializationVector = randomBytes(INITIALIZATION_VECTOR_LENGTH)
  const cipher = createCipheriv("aes-256-gcm", readEncryptionKey(), initializationVector)

  const payload = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ])

  return `v1:${initializationVector.toString("base64")}:${payload.toString("base64")}`
}
