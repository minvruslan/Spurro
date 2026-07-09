import { UnrecoverableError } from "bullmq"
import { SupportedProtocolCodeSchema } from "@spurro/shared"
import type { EndpointContract } from "@spurro/shared/infrastructure"
import { getProtocolClient } from "@spurro/infrastructure"
import type { Amneziawg2ProtocolClient } from "@spurro/infrastructure"
import { findActiveEndpoints } from "../queries/findActiveEndpoints.js"
import { updateEndpointData } from "../queries/updateEndpointData.js"

export async function ensureEndpointContracts(serverId: string) {
  const endpoints = await findActiveEndpoints(serverId)

  const seenProtocolCodes = new Set<string>()

  const deployments: {
    client: Amneziawg2ProtocolClient
    contract: EndpointContract
    endpointId: string
    endpointData: (typeof endpoints)[number]["data"]
  }[] = []

  for (const row of endpoints) {
    const parsedCode = SupportedProtocolCodeSchema.safeParse(row.protocolCode)

    if (!parsedCode.success) {
      throw new UnrecoverableError(
        `[provision] server ${serverId} endpoint ${row.endpointId} has unknown protocol "${row.protocolCode}"`,
      )
    }

    const protocolCode = parsedCode.data

    if (seenProtocolCodes.has(protocolCode)) {
      throw new UnrecoverableError(
        `[provision] server ${serverId} has multiple active endpoints of protocol "${protocolCode}"; one active endpoint per protocol is supported`,
      )
    }

    seenProtocolCodes.add(protocolCode)

    const client = getProtocolClient(protocolCode)

    let contract = row.data?.contract
    if (!contract?.protocolCode) {
      contract = client.createEndpointContract(row.port)
      await updateEndpointData(row.endpointId, { ...row.data, contract })
    }

    const revisionCompatibility = client.assessRevisionCompatibility(contract.revision)
    if (revisionCompatibility === "requires_migration") {
      throw new UnrecoverableError(
        `[provision] server ${serverId} endpoint ${row.endpointId} is deployed with revision ${contract.revision}, code supports in-place upgrade from revision ${client.clientSupportedRevision} and up; redeploy may invalidate created user configs — a state migration is required`,
      )
    }
    if (revisionCompatibility === "newer_than_code") {
      throw new UnrecoverableError(
        `[provision] server ${serverId} endpoint ${row.endpointId} is deployed with revision ${contract.revision}, code has older revision ${client.clientRevision}; refusing to downgrade the server`,
      )
    }

    deployments.push({
      client,
      contract,
      endpointId: row.endpointId,
      endpointData: { ...row.data, contract },
    })
  }

  return deployments
}
