let encryptionKey: Buffer | undefined

export function readEncryptionKey(): Buffer {
  if (encryptionKey) return encryptionKey

  const decoded = Buffer.from(process.env.APP_ENCRYPTION_KEY ?? "", "base64")

  if (decoded.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY must be 32 bytes encoded as base64")
  }

  encryptionKey = decoded

  return encryptionKey
}
