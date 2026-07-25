import { SUPPORTED_PROTOCOLS } from "@spurro/shared"
import type { ServerContract } from "@spurro/infrastructure/types"
import type { RemoteServer } from "@spurro/infrastructure"
import { updateEndpointData } from "../queries/updateEndpointData.js"
import type { ensureEndpointContracts } from "./ensureEndpointContracts.js"

type EndpointDeployment = Awaited<ReturnType<typeof ensureEndpointContracts>>[number]

export async function deployEndpoints(
  remoteServer: RemoteServer,
  serverContract: ServerContract,
  deployments: EndpointDeployment[],
): Promise<void> {
  for (const { client, endpointId, data } of deployments) {
    await remoteServer.allowFirewallPort(
      data.contract.port,
      SUPPORTED_PROTOCOLS[client.protocolCode].transportProtocol,
    )
    await client.install(serverContract, data.contract)

    await updateEndpointData(endpointId, {
      ...data,
      state: { ...data.state, deployedAt: new Date().toISOString() },
    })
  }
}
