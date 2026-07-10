import { ServerContractSchema, type ServerAccess } from "@spurro/shared/infrastructure"
import type { server } from "@/core/database/schemas/domainSchema.js"
import { BOOTSTRAP_SSH_PORT } from "./BOOTSTRAP_SSH_PORT.js"
import { buildServiceUserAccess } from "./buildServiceUserAccess.js"

type ServerRow = {
  ip: string
  data: typeof server.$inferSelect.data
}

export function buildServerAccess(row: ServerRow): ServerAccess | null {
  const data = row.data
  const sshHostKeys = data?.sshHostKeys

  if (!data?.ssh || !sshHostKeys?.length) return null

  if ("hardenedAt" in data.ssh) {
    const serverContract = ServerContractSchema.safeParse(data.contract)
    if (!serverContract.success) return null
    return buildServiceUserAccess(
      row.ip,
      serverContract.data,
      sshHostKeys,
      serverContract.data.sshPort,
    )
  }

  return {
    ip: row.ip,
    port: BOOTSTRAP_SSH_PORT,
    username: data.ssh.username,
    password: data.ssh.password,
    sshHostKeys,
  }
}
