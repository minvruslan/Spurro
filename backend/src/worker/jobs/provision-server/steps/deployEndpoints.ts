import { SUPPORTED_PROTOCOLS } from "@spurro/shared"
import type { ServerAccess, ServerContract } from "@spurro/shared/infrastructure"
import { Amneziawg2ProtocolClient, ServerProvisioner } from "@spurro/infrastructure"
import { updateEndpointData } from "../queries/updateEndpointData.js"
import type { ensureEndpointContracts } from "./ensureEndpointContracts.js"

type EndpointDeployment = Awaited<ReturnType<typeof ensureEndpointContracts>>[number]

export async function deployEndpoints(
  serverAccess: ServerAccess,
  serverContract: ServerContract,
  deployments: EndpointDeployment[],
): Promise<void> {
  const serverProvisioner = new ServerProvisioner(serverAccess)

  for (const { client, contract, endpointId, endpointData } of deployments) {
    const endpointContract = Amneziawg2ProtocolClient.parseEndpointContract(contract)

    await serverProvisioner.allowFirewallPort(
      endpointContract.port,
      SUPPORTED_PROTOCOLS[client.protocolCode].transportProtocol,
    )
    await client.deploy(serverAccess, serverContract, endpointContract)

    await updateEndpointData(endpointId, {
      ...endpointData,
      contract: {
        ...contract,
        version: client.version,
        revision: client.clientRevision,
        deployedAt: new Date().toISOString(),
      },
    })
  }
}
