import type { SupportedProtocolCode } from "@spurro/shared"
import { SupportedProtocolCodeSchema } from "@spurro/shared"
import type { EndpointActualState, ServerActualState } from "@spurro/infrastructure/types"
import { EndpointActualStateSchema } from "@spurro/infrastructure/types"
import type { ProtocolClient } from "@spurro/infrastructure"
import { RemoteServer } from "@spurro/infrastructure"
import { db } from "@/core/database/index.js"
import { env } from "@/core/env/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findEndpointProtocolClientData } from "../queries/findEndpointProtocolClientData.js"

type EndpointProtocolClient = {
  client: ProtocolClient
  server: { ip: string; domainName: string | null; actualState: ServerActualState }
  endpointActualState: EndpointActualState
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
      errorCode: "unavailable",
      error: new Error(`Endpoint ${endpointId} not found.`),
    }
  }

  const parsedCode = SupportedProtocolCodeSchema.safeParse(endpointProtocolClientData.protocolCode)
  if (!parsedCode.success) {
    return {
      ok: false,
      errorCode: "unsupported_protocol",
      error: new Error(
        `Endpoint ${endpointId} has unsupported protocol "${endpointProtocolClientData.protocolCode}".`,
      ),
    }
  }

  const serverData = endpointProtocolClientData.serverData
  if (!serverData) {
    return {
      ok: false,
      errorCode: "unavailable",
      error: new Error(`Endpoint ${endpointId} server has no valid data.`),
    }
  }

  const serverAccess = RemoteServer.buildServerAccessFromActualState(
    { ip: endpointProtocolClientData.serverIp, data: serverData },
    env.APP_SSH_PRIVATE_KEY,
  )
  if (!serverAccess) {
    return {
      ok: false,
      errorCode: "unavailable",
      error: new Error(`Endpoint ${endpointId} server has no usable access.`),
    }
  }

  if (!serverData.actualState.dns) {
    return {
      ok: false,
      errorCode: "unavailable",
      error: new Error(
        `Endpoint ${endpointId} server actual state has no DNS; server may not be hardened.`,
      ),
    }
  }

  const endpointActualState = EndpointActualStateSchema.safeParse(
    endpointProtocolClientData.endpointData?.actualState,
  )
  if (!endpointActualState.success) {
    return {
      ok: false,
      errorCode: "unavailable",
      error: new Error(`Endpoint ${endpointId} has no actual state; it may not be deployed.`),
    }
  }

  const client = new RemoteServer(serverAccess).getProtocolClient(parsedCode.data)

  return {
    ok: true,
    data: {
      client,
      server: {
        ip: endpointProtocolClientData.serverIp,
        domainName: endpointProtocolClientData.serverDomainName,
        actualState: serverData.actualState,
      },
      endpointActualState: endpointActualState.data,
      protocolCode: parsedCode.data,
    },
  }
}
