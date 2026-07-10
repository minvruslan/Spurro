import { ServerProvisioner } from "@spurro/infrastructure"
import { BOOTSTRAP_SSH_PORT } from "@/core/server-access/index.js"
import { updateServerData } from "../queries/updateServerData.js"
import type { findProvisionableServer } from "./findProvisionableServer.js"

type ProvisionableServer = Awaited<ReturnType<typeof findProvisionableServer>>

export async function ensureSSHHostKeys(
  serverId: string,
  server: ProvisionableServer,
): Promise<string[]> {
  const existing = server.data.sshHostKeys
  if (existing?.length) return existing

  const sshHostKeys = await ServerProvisioner.scanSSHHostKeys(server.ip, BOOTSTRAP_SSH_PORT)

  const data = { ...server.data, sshHostKeys }
  await updateServerData(serverId, data)
  server.data = data

  return sshHostKeys
}
