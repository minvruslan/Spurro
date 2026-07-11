import type { ConfigProtocolFields } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/domainSchema.js"

type ConfigFields = {
  userId: string
  endpointId: string
  deviceTypeId: string
  name: string
} & ConfigProtocolFields

export async function insertUserConfig(executor: DbOrTx, fields: ConfigFields) {
  return executor.insert(config).values(fields).returning({ id: config.id })
}
