import { ProtocolCodeSchema } from "@spurro/api-contract"
import type { ProtocolClient, RemoteServer } from "@spurro/infrastructure"
import { EndpointDesiredStateSchema } from "@spurro/infrastructure/types"
import type { EndpointData, EndpointDesiredState } from "@spurro/infrastructure/types"
import { ProvisioningError } from "../ProvisioningError.js"
import type { ProvisioningStep } from "./ProvisioningStep.js"

type EndpointDeployment = {
  client: ProtocolClient
  endpointId: string
  endpointData: EndpointData
  endpointDesiredState: EndpointDesiredState
}

type EndpointDataUpdate = {
  endpointId: string
  endpointData: EndpointData
}

export const resolveEndpointDeployments: ProvisioningStep<
  {
    remoteServer: RemoteServer
    endpoints: {
      endpointId: string
      port: number
      protocolCode: string
      data: EndpointData | null
    }[]
  },
  { endpointDeployments: EndpointDeployment[]; endpointDataUpdates: EndpointDataUpdate[] }
> = async (serverId, { remoteServer, endpoints }) => {
  const endpointDeployments: EndpointDeployment[] = []
  const endpointDataUpdates: EndpointDataUpdate[] = []

  for (const endpoint of endpoints) {
    const parsedProtocolCode = ProtocolCodeSchema.safeParse(endpoint.protocolCode)
    /* v8 ignore start */
    if (!parsedProtocolCode.success) {
      throw new ProvisioningError(
        serverId,
        "unknown_protocol",
        new Error(
          `Endpoint ${endpoint.endpointId} has unknown protocol "${endpoint.protocolCode}".`,
        ),
      )
    }
    /* v8 ignore stop */

    if (endpoint.data === null) {
      throw new ProvisioningError(
        serverId,
        "invalid_endpoint_data",
        new Error(`Endpoint ${endpoint.endpointId} has invalid data.`),
      )
    }

    const parsedDesiredState = EndpointDesiredStateSchema.safeParse(endpoint.data.desiredState)
    if (!parsedDesiredState.success && endpoint.data.desiredState !== undefined) {
      throw new ProvisioningError(
        serverId,
        "invalid_endpoint_desired_state",
        new Error(`Endpoint ${endpoint.endpointId} has invalid desired state.`, {
          cause: parsedDesiredState.error,
        }),
      )
    }

    const client = remoteServer.getProtocolClient(parsedProtocolCode.data)

    let endpointData = endpoint.data
    let endpointDesiredState = parsedDesiredState.success ? parsedDesiredState.data : undefined

    if (!endpointDesiredState) {
      endpointDesiredState = client.createEndpointDesiredState(endpoint.port)
      endpointData = { ...endpointData, desiredState: endpointDesiredState }
      endpointDataUpdates.push({ endpointId: endpoint.endpointId, endpointData })
    }

    endpointDeployments.push({
      client,
      endpointId: endpoint.endpointId,
      endpointData,
      endpointDesiredState,
    })
  }

  return { endpointDeployments, endpointDataUpdates }
}
