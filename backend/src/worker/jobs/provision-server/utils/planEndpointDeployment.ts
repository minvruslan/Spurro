import { SupportedProtocolCodeSchema } from "@spurro/shared"
import type { SupportedProtocolCode } from "@spurro/shared"
import { EndpointDesiredStateSchema } from "@spurro/infrastructure/types"
import type { EndpointData, EndpointDesiredState } from "@spurro/infrastructure/types"

type PlanEndpointDeploymentResult =
  | {
      ok: true
      protocolCode: SupportedProtocolCode
      endpointData: EndpointData
      endpointDesiredState?: EndpointDesiredState
    }
  | {
      ok: false
      errorCode:
        | "unknown_protocol"
        | "duplicate_protocol_endpoint"
        | "invalid_endpoint_data"
        | "invalid_endpoint_desired_state"
      error?: unknown
    }

export function planEndpointDeployment(
  endpoint: { protocolCode: string; data: EndpointData | null },
  seenProtocolCodes: ReadonlySet<string>,
): PlanEndpointDeploymentResult {
  const parsedProtocolCode = SupportedProtocolCodeSchema.safeParse(endpoint.protocolCode)
  if (!parsedProtocolCode.success) return { ok: false, errorCode: "unknown_protocol" }

  const protocolCode = parsedProtocolCode.data
  if (seenProtocolCodes.has(protocolCode)) {
    return { ok: false, errorCode: "duplicate_protocol_endpoint" }
  }

  if (endpoint.data === null) return { ok: false, errorCode: "invalid_endpoint_data" }

  const parsedDesiredState = EndpointDesiredStateSchema.safeParse(endpoint.data.desiredState)
  if (parsedDesiredState.success) {
    return {
      ok: true,
      protocolCode,
      endpointData: endpoint.data,
      endpointDesiredState: parsedDesiredState.data,
    }
  }

  if (endpoint.data.desiredState !== undefined) {
    return {
      ok: false,
      errorCode: "invalid_endpoint_desired_state",
      error: parsedDesiredState.error,
    }
  }

  return { ok: true, protocolCode, endpointData: endpoint.data }
}
