import type { ServerStatus } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"

type ServerFields = {
  name: string
  domainName: string | null
  ip: string
  country: string
  status?: ServerStatus
  data?: { ssh: { login: string; password: string } }
}

export async function insertServer(executor: DbOrTx, fields: ServerFields) {
  return executor.insert(server).values(fields).returning({ id: server.id })
}
