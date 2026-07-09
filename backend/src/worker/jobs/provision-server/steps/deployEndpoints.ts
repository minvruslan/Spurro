import type { ServerAccess, ServerContract } from "@spurro/shared/infrastructure"
import { Amneziawg2ProtocolClient, RemoteCommandRunner } from "@spurro/infrastructure"
import { updateEndpointData } from "../queries/updateEndpointData.js"
import type { ensureEndpointContracts } from "./ensureEndpointContracts.js"

type EndpointDeployment = Awaited<ReturnType<typeof ensureEndpointContracts>>[number]

export async function deployEndpoints(
  serverAccess: ServerAccess,
  serverContract: ServerContract,
  deployments: EndpointDeployment[],
): Promise<void> {
  await new RemoteCommandRunner(serverAccess).bootstrapServer(
    serverContract.service.username,
    serverContract.service.baseDirectory,
  )

  for (const { client, contract, endpointId, endpointData } of deployments) {
    await client.deploy(
      serverAccess,
      serverContract,
      Amneziawg2ProtocolClient.assertEndpointContract(contract),
    )
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
