import type { SupportedProtocolCode } from "@spurro/shared"
import { SupportedProtocolCodeSchema } from "@spurro/shared"
import type { EndpointContract, ServerContract } from "@spurro/infrastructure/types"
import { EndpointContractSchema, ServerContractSchema } from "@spurro/infrastructure/types"
import { RemoteServer } from "@spurro/infrastructure"
import { db } from "@/core/database/index.js"
import { env } from "@/core/env/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findEndpointProtocolClientData } from "../queries/findEndpointProtocolClientData.js"

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
  const endpointProtocolClientData = await findEndpointProtocolClientData(db, endpointId)
  if (!endpointProtocolClientData) {
    return {
      ok: false,
      reason: "unavailable",
      error: new Error(`Endpoint ${endpointId} not found.`),
    }
  }

  const parsedCode = SupportedProtocolCodeSchema.safeParse(endpointProtocolClientData.protocolCode)
  if (!parsedCode.success) {
    return {
      ok: false,
      reason: "unsupported_protocol",
      error: new Error(
        `Endpoint ${endpointId} has unsupported protocol "${endpointProtocolClientData.protocolCode}".`,
      ),
    }
  }

  const serverAccess = endpointProtocolClientData.serverData
    ? RemoteServer.buildServerAccess(
        { ip: endpointProtocolClientData.serverIp, data: endpointProtocolClientData.serverData },
        env.APP_SSH_PRIVATE_KEY,
      )
    : null
  const serverContract = ServerContractSchema.safeParse(
    endpointProtocolClientData.serverData?.contract,
  )
  if (!serverAccess || !serverContract.success) {
    return {
      ok: false,
      reason: "unavailable",
      error: new Error(`Endpoint ${endpointId} server has no usable access or contract.`),
    }
  }

  const endpointContract = EndpointContractSchema.safeParse(
    endpointProtocolClientData.endpointData?.contract,
  )
  if (!endpointContract.success) {
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
      serverContract: serverContract.data,
      endpointContract: endpointContract.data,
      protocolCode: parsedCode.data,
    },
  }
}
