import { UnrecoverableError } from "bullmq"
import { SupportedProtocolCodeSchema } from "@spurro/shared"
import { EndpointContractSchema } from "@spurro/infrastructure/types"
import type { EndpointContract, EndpointData } from "@spurro/infrastructure/types"
import type { RemoteServer } from "@spurro/infrastructure"
import { findActiveEndpoints } from "../queries/findActiveEndpoints.js"
import { updateEndpointData } from "../queries/updateEndpointData.js"

export async function ensureEndpointContracts(serverId: string, remoteServer: RemoteServer) {
  const endpoints = await findActiveEndpoints(serverId)

  const seenProtocolCodes = new Set<string>()

  const deployments: {
    client: ReturnType<RemoteServer["getProtocolClient"]>
    endpointId: string
    data: EndpointData & { contract: EndpointContract }
  }[] = []

  for (const row of endpoints) {
    const parsedCode = SupportedProtocolCodeSchema.safeParse(row.protocolCode)

    if (!parsedCode.success) {
      throw new UnrecoverableError(
        `Server ${serverId} endpoint ${row.endpointId} has unknown protocol "${row.protocolCode}".`,
      )
    }

    const protocolCode = parsedCode.data

    if (seenProtocolCodes.has(protocolCode)) {
      throw new UnrecoverableError(
        `Server ${serverId} has multiple active endpoints of protocol "${protocolCode}"; one active endpoint per protocol is supported.`,
      )
    }

    seenProtocolCodes.add(protocolCode)

    const client = remoteServer.getProtocolClient(protocolCode)

    if (row.data === null) {
      throw new UnrecoverableError(
        `Server ${serverId} endpoint ${row.endpointId} has data that failed schema validation; refusing to touch its contract.`,
      )
    }

    const existingContract = EndpointContractSchema.safeParse(row.data.contract)
    let contract: EndpointContract
    if (existingContract.success) {
      contract = existingContract.data
    } else if (row.data.contract !== undefined) {
      throw new UnrecoverableError(
        `Server ${serverId} endpoint ${row.endpointId} has a contract that failed schema validation; refusing to recreate it: ${existingContract.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")}.`,
      )
    } else {
      contract = client.createEndpointContract(row.port)
      await updateEndpointData(row.endpointId, { ...row.data, contract })
    }

    deployments.push({
      client,
      endpointId: row.endpointId,
      data: { ...row.data, contract },
    })
  }

  return deployments
}
