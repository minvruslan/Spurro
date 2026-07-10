import { ServerContractSchema } from "@spurro/shared/infrastructure"
import type { ServerContract } from "@spurro/shared/infrastructure"
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
  const existing = server.data.contract
  const parsedExisting = ServerContractSchema.safeParse(existing)
  if (parsedExisting.success) return parsedExisting.data

  const contract = ServerContractSchema.parse({
    domain: existing?.domain !== undefined ? existing.domain : server.domainName,
    ip: existing?.ip ?? server.ip,
    sshPort: existing?.sshPort ?? VPN_NODE_SSH_PORT,
    dns: existing?.dns ?? VPN_NODE_DNS,
    service: {
      username: existing?.service?.username ?? VPN_NODE_USERNAME,
      baseDirectory: existing?.service?.baseDirectory ?? VPN_NODE_BASE_DIRECTORY,
    },
  })

  const data = { ...server.data, contract }
  await updateServerData(serverId, data)
  server.data = data
  return contract
}
