import { customType } from "drizzle-orm/pg-core"
import { decryptString, encryptString } from "../../crypto/index.js"

export function encryptedJsonb<TData>(name: string) {
  return customType<{ data: TData; driverData: string }>({
    dataType() {
      return "text"
    },
    toDriver(value) {
      return encryptString(JSON.stringify(value))
    },
    fromDriver(value) {
      return JSON.parse(decryptString(value)) as TData
    },
  })(name)
}
