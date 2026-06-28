import type { ServerStatus } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"

export type ServerFields = {
  name: string
  domainName: string
  ip: string
  country: string
  status?: ServerStatus
}

export async function insertServer(executor: DbOrTx, fields: ServerFields) {
  return executor.insert(server).values(fields).returning({ id: server.id })
}
