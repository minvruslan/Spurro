import { createDecipheriv } from "node:crypto"
import { readEncryptionKey } from "./readEncryptionKey.js"

const AUTH_TAG_LENGTH = 16

export function decryptString(ciphertext: string): string {
  const parts = ciphertext.split(":")

  const [version, initializationVectorEncoded, payloadEncoded] = parts

  if (parts.length !== 3 || version !== "v1" || !initializationVectorEncoded || !payloadEncoded) {
    throw new Error("unsupported ciphertext format")
  }

  const initializationVector = Buffer.from(initializationVectorEncoded, "base64")
  const payload = Buffer.from(payloadEncoded, "base64")

  if (payload.length < AUTH_TAG_LENGTH) {
    throw new Error("ciphertext payload is shorter than the auth tag")
  }

  const decipher = createDecipheriv("aes-256-gcm", readEncryptionKey(), initializationVector)
  decipher.setAuthTag(payload.subarray(payload.length - AUTH_TAG_LENGTH))

  return Buffer.concat([
    decipher.update(payload.subarray(0, payload.length - AUTH_TAG_LENGTH)),
    decipher.final(),
  ]).toString("utf8")
}
