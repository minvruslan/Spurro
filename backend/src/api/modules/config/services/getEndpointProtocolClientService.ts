import type { SupportedProtocolCode } from "@spurro/shared"
import { ServerContractSchema } from "@spurro/shared/infrastructure"
import { RemoteServer } from "@spurro/infrastructure"
import { db } from "@/core/database/index.js"
import { buildServerAccess } from "@/core/server-access/index.js"
import { findEndpointData } from "../queries/findEndpointData.js"
import { findServerAccess } from "../queries/findServerAccess.js"

export async function getEndpointProtocolClientService(
  serverId: string,
  endpointId: string,
  protocolCode: SupportedProtocolCode,
) {
  const access = await findServerAccess(db, serverId)
  if (!access) return { ok: false as const, reason: "unavailable" as const }

  const serverAccess = buildServerAccess(access)
  const serverContract = access.data?.contract
  if (!serverAccess || !serverContract)
    return { ok: false as const, reason: "unavailable" as const }

  const endpointData = await findEndpointData(db, endpointId)
  const endpointContract = endpointData?.data?.contract
  if (!endpointContract) return { ok: false as const, reason: "unavailable" as const }

  const client = new RemoteServer(serverAccess).getProtocolClient(protocolCode)

  const { revision } = endpointContract
  if (client.assessRevisionCompatibility(revision) !== "supported") {
    console.error(
      `[config] endpoint ${endpointId} server revision ${revision ?? "unknown"} is outside the supported range [${client.clientSupportedRevision}, ${client.clientRevision}]; re-provision the server`,
    )
    return { ok: false as const, reason: "unsupported_revision" as const }
  }

  return {
    ok: true as const,
    client,
    serverContract: ServerContractSchema.parse(serverContract),
    endpointContract,
  }
}
