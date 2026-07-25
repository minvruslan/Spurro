import { ServerContractSchema, type ServerAccess, type ServerData } from "../types/index.js"
import { BOOTSTRAP_SSH_PORT } from "./BOOTSTRAP_SSH_PORT.js"
import { buildServiceUserAccess } from "./buildServiceUserAccess.js"

export function buildServerAccess(
  row: { ip: string; data: ServerData | null },
  appSshPrivateKey: string,
): ServerAccess | null {
  const state = row.data?.state
  const sshHostKeys = state?.sshHostKeys

  if (!state?.ssh || !sshHostKeys?.length) return null

  if ("hardenedAt" in state.ssh) {
    const serverContract = ServerContractSchema.safeParse(row.data?.contract)
    if (!serverContract.success) return null
    return buildServiceUserAccess(
      row.ip,
      serverContract.data,
      sshHostKeys,
      serverContract.data.sshPort,
      appSshPrivateKey,
    )
  }

  return {
    ip: row.ip,
    port: BOOTSTRAP_SSH_PORT,
    username: state.ssh.username,
    password: state.ssh.password,
    sshHostKeys,
  }
}
