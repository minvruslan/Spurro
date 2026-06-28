import type { DbOrTx } from "@/core/database/index.js"
import { accessGrant } from "@/core/database/schemas/domainSchema.js"

export type ConfigFields = {
  userId: string
  endpointId: string
  deviceTypeId: string
  name: string
  config: unknown
}

export async function insertConfig(executor: DbOrTx, fields: ConfigFields) {
  return executor.insert(accessGrant).values(fields).returning({ id: accessGrant.id })
}
