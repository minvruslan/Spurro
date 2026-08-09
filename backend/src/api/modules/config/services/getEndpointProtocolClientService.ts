import type { ProtocolCode } from "@spurro/api-contract"
import { ProtocolCodeSchema } from "@spurro/api-contract"
import type { EndpointActualState } from "@spurro/infrastructure/types"
import { EndpointActualStateSchema } from "@spurro/infrastructure/types"
import type { ProtocolClient } from "@spurro/infrastructure"
import { RemoteServer } from "@spurro/infrastructure"
import { db } from "@/core/database/index.js"
import { env } from "@/core/env/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findEndpointProtocolClientData } from "../queries/findEndpointProtocolClientData.js"

type EndpointProtocolClient = {
  client: ProtocolClient
  endpointActualState: EndpointActualState
  protocolCode: ProtocolCode
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

  const parsedCode = ProtocolCodeSchema.safeParse(endpointProtocolClientData.protocolCode)
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

  const endpointActualState = EndpointActualStateSchema.safeParse(
    endpointProtocolClientData.endpointData?.actualState,
  )
  if (!endpointActualState.success) {
    return {
      ok: false,
      errorCode: "unavailable",
      error: new Error(`Endpoint ${endpointId} has no actual state.`),
    }
  }

  const client = new RemoteServer(serverAccess).getProtocolClient(parsedCode.data)

  try {
    client.parseEndpointActualState(endpointActualState.data)
  } catch (error) {
    return {
      ok: false,
      errorCode: "unavailable",
      error: new Error(`Endpoint ${endpointId} actual state failed protocol validation.`, {
        cause: error,
      }),
    }
  }

  return {
    ok: true,
    data: {
      client,
      endpointActualState: endpointActualState.data,
      protocolCode: parsedCode.data,
    },
  }
}
