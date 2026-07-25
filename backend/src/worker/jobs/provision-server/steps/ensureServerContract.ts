import { ServerContractSchema } from "@spurro/infrastructure/types"
import type { ServerContract } from "@spurro/infrastructure/types"
import { buildServerContract } from "@spurro/infrastructure"
import {
  VPN_NODE_BASE_DIRECTORY,
  VPN_NODE_DNS,
  VPN_NODE_SSH_PORT,
  VPN_NODE_USERNAME,
} from "../constants/index.js"
import { updateServerData } from "../queries/updateServerData.js"
import type { findProvisionableServer } from "./findProvisionableServer.js"

type ProvisionableServer = Awaited<ReturnType<typeof findProvisionableServer>>

export async function ensureServerContract(
  serverId: string,
  server: ProvisionableServer,
): Promise<ServerContract> {
  const parsedExisting = ServerContractSchema.safeParse(server.data.contract)
  if (parsedExisting.success) return parsedExisting.data

  const contract = buildServerContract({
    domain: server.domainName,
    ip: server.ip,
    sshPort: VPN_NODE_SSH_PORT,
    dns: VPN_NODE_DNS,
    serviceUsername: VPN_NODE_USERNAME,
    baseDirectory: VPN_NODE_BASE_DIRECTORY,
  })

  const data = { ...server.data, contract }
  await updateServerData(serverId, data)
  server.data = data
  return contract
}
