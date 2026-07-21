import type { SupportedProtocolCode } from "@spurro/shared"
import type { EndpointContract, ServerContract } from "@spurro/shared/infrastructure"
import { ServerContractSchema } from "@spurro/shared/infrastructure"
import { RemoteServer } from "@spurro/infrastructure"
import { db } from "@/core/database/index.js"
import { configLogger } from "@/core/logger/index.js"
import { buildServerAccess } from "@/core/server-access/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findEndpointData } from "../queries/findEndpointData.js"
import { findServerAccess } from "../queries/findServerAccess.js"

type EndpointProtocolClient = {
  client: ReturnType<RemoteServer["getProtocolClient"]>
  serverContract: ServerContract
  endpointContract: EndpointContract
}

export async function getEndpointProtocolClientService(
  serverId: string,
  endpointId: string,
  protocolCode: SupportedProtocolCode,
): Promise<ServiceResult<EndpointProtocolClient, "unavailable" | "unsupported_revision">> {
  const access = await findServerAccess(db, serverId)
  if (!access) return { ok: false, reason: "unavailable" }

  const serverAccess = buildServerAccess(access)
  const serverContract = access.data?.contract
  if (!serverAccess || !serverContract) return { ok: false, reason: "unavailable" }

  const endpointData = await findEndpointData(db, endpointId)
  const endpointContract = endpointData?.data?.contract
  if (!endpointContract) return { ok: false, reason: "unavailable" }

  const client = new RemoteServer(serverAccess).getProtocolClient(protocolCode)

  const { revision } = endpointContract
  if (client.assessRevisionCompatibility(revision) !== "supported") {
    configLogger.error(
      `Endpoint ${endpointId} server revision ${revision ?? "unknown"} is outside the supported range [${client.clientSupportedRevision}, ${client.clientRevision}]; re-provision the server.`,
    )
    return { ok: false, reason: "unsupported_revision" }
  }

  return {
    ok: true,
    client,
    serverContract: ServerContractSchema.parse(serverContract),
    endpointContract,
  }
}
