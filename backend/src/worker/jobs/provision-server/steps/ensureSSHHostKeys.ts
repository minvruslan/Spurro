import { RemoteServer, BOOTSTRAP_SSH_PORT } from "@spurro/infrastructure"
import { updateServerData } from "../queries/updateServerData.js"
import type { findProvisionableServer } from "./findProvisionableServer.js"

type ProvisionableServer = Awaited<ReturnType<typeof findProvisionableServer>>

export async function ensureSSHHostKeys(
  serverId: string,
  server: ProvisionableServer,
): Promise<string[]> {
  const existing = server.data.state.sshHostKeys
  if (existing?.length) return existing

  const sshHostKeys = await RemoteServer.scanSSHHostKeys(server.ip, BOOTSTRAP_SSH_PORT)

  const data = { ...server.data, state: { ...server.data.state, sshHostKeys } }
  await updateServerData(serverId, data)
  server.data = data

  return sshHostKeys
}
