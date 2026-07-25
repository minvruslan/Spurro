import { SUPPORTED_PROTOCOLS } from "@spurro/shared"
import type { ServerContract } from "@spurro/shared/infrastructure"
import type { RemoteServer } from "@spurro/infrastructure"
import { updateEndpointData } from "../queries/updateEndpointData.js"
import type { ensureEndpointContracts } from "./ensureEndpointContracts.js"

type EndpointDeployment = Awaited<ReturnType<typeof ensureEndpointContracts>>[number]

export async function deployEndpoints(
  remoteServer: RemoteServer,
  serverContract: ServerContract,
  deployments: EndpointDeployment[],
): Promise<void> {
  for (const { client, contract, endpointId, endpointData } of deployments) {
    await remoteServer.allowFirewallPort(
      contract.port,
      SUPPORTED_PROTOCOLS[client.protocolCode].transportProtocol,
    )
    await client.install(serverContract, contract)

    await updateEndpointData(endpointId, {
      ...endpointData,
      contract: {
        ...contract,
        deployedAt: new Date().toISOString(),
      },
    })
  }
}
