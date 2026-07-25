import { UnrecoverableError } from "bullmq"
import { RemoteServer } from "@spurro/infrastructure"
import { updateServerData } from "../queries/updateServerData.js"
import type { findProvisionableServer } from "./findProvisionableServer.js"

type ProvisionableServer = Awaited<ReturnType<typeof findProvisionableServer>>

export async function ensureSSHHostKeys(
  serverId: string,
  server: ProvisionableServer,
): Promise<string[]> {
  const existing = server.data.state.sshHostKeys
  if (existing?.length) return existing

  const ssh = server.data.state.ssh
  if ("hardenedAt" in ssh) {
    throw new UnrecoverableError(`Server ${serverId} is hardened but has no SSH host keys.`)
  }

  const sshHostKeys = await RemoteServer.scanSSHHostKeys(server.ip, ssh.port)

  const data = { ...server.data, state: { ...server.data.state, sshHostKeys } }
  await updateServerData(serverId, data)
  server.data = data

  return sshHostKeys
}
