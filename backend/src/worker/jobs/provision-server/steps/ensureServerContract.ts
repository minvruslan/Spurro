import { ServerContractSchema } from "@spurro/shared/infrastructure"
import type { ServerContract } from "@spurro/shared/infrastructure"
import { VPN_NODE_BASE_DIRECTORY, VPN_NODE_DNS, VPN_NODE_USERNAME } from "../constants/index.js"
import { updateServerData } from "../queries/updateServerData.js"
import type { findProvisionableServer } from "./findProvisionableServer.js"

type ProvisionableServer = Awaited<ReturnType<typeof findProvisionableServer>>

export async function ensureServerContract(
  serverId: string,
  server: ProvisionableServer,
): Promise<ServerContract> {
  let contract = server.data.contract
  if (!contract?.service?.username || !contract.ip || !contract.dns) {
    contract = {
      domain: server.domainName,
      ip: server.ip,
      dns: VPN_NODE_DNS,
      service: {
        username: VPN_NODE_USERNAME,
        baseDirectory: VPN_NODE_BASE_DIRECTORY,
      },
    }
    await updateServerData(serverId, { ...server.data, contract })
  }
  return ServerContractSchema.parse(contract)
}
