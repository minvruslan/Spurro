import { customType } from "drizzle-orm/pg-core"
import { decryptString, encryptString } from "../../crypto/index.js"

export function encryptedText(name: string) {
  return customType<{ data: string; driverData: string }>({
    dataType() {
      return "text"
    },
    toDriver(value) {
      return encryptString(value)
    },
    fromDriver(value) {
      return decryptString(value)
    },
  })(name)
}
