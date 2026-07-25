import type { SupportedProtocolCode } from "@spurro/shared"
import { SupportedProtocolCodeSchema } from "@spurro/shared"
import type { EndpointContract, ServerContract } from "@spurro/shared/infrastructure"
import { ServerContractSchema } from "@spurro/shared/infrastructure"
import { RemoteServer } from "@spurro/infrastructure"
import { db } from "@/core/database/index.js"
import { buildServerAccess } from "@/core/server-access/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findEndpointAccessData } from "../queries/findEndpointAccessData.js"

type EndpointProtocolClient = {
  client: ReturnType<RemoteServer["getProtocolClient"]>
  serverContract: ServerContract
  endpointContract: EndpointContract
  protocolCode: SupportedProtocolCode
}

type ErrorCode = "unavailable" | "unsupported_protocol"

export async function getEndpointProtocolClientService(
  endpointId: string,
): Promise<ServiceResult<EndpointProtocolClient, ErrorCode>> {
  const accessData = await findEndpointAccessData(db, endpointId)
  if (!accessData) {
    return {
      ok: false,
      reason: "unavailable",
      error: new Error(`Endpoint ${endpointId} not found.`),
    }
  }

  const parsedCode = SupportedProtocolCodeSchema.safeParse(accessData.protocolCode)
  if (!parsedCode.success) {
    return {
      ok: false,
      reason: "unsupported_protocol",
      error: new Error(
        `Endpoint ${endpointId} has unsupported protocol "${accessData.protocolCode}".`,
      ),
    }
  }

  const serverAccess = buildServerAccess({ ip: accessData.serverIp, data: accessData.serverData })
  const serverContract = accessData.serverData?.contract
  if (!serverAccess || !serverContract) {
    return {
      ok: false,
      reason: "unavailable",
      error: new Error(`Endpoint ${endpointId} server has no usable access or contract.`),
    }
  }

  const endpointContract = accessData.endpointData?.contract
  if (!endpointContract) {
    return {
      ok: false,
      reason: "unavailable",
      error: new Error(`Endpoint ${endpointId} has no contract; server may not be provisioned.`),
    }
  }

  const client = new RemoteServer(serverAccess).getProtocolClient(parsedCode.data)

  return {
    ok: true,
    data: {
      client,
      serverContract: ServerContractSchema.parse(serverContract),
      endpointContract,
      protocolCode: parsedCode.data,
    },
  }
}
