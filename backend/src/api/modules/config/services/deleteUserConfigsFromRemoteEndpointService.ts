import type { ServiceResult } from "@/core/types/index.js"
import type { DeletableUserConfig } from "../queries/findDeletableUserConfigs.js"
import { getEndpointProtocolClientService } from "./getEndpointProtocolClientService.js"

type ErrorCode = "endpoint_mismatch" | "unsupported_protocol" | "unavailable" | "delete_failed"

export async function deleteUserConfigsFromRemoteEndpointService(
  endpointId: string,
  configs: DeletableUserConfig[],
): Promise<ServiceResult<null, ErrorCode>> {
  if (configs.length === 0) return { ok: true, data: null }

  const mismatchedConfigIds = configs
    .filter((config) => config.endpointId !== endpointId)
    .map((config) => config.id)

  if (mismatchedConfigIds.length > 0) {
    return {
      ok: false,
      errorCode: "endpoint_mismatch",
      error: new Error(
        `Configs [${mismatchedConfigIds.join(", ")}] do not belong to endpoint ${endpointId}; configs not deleted.`,
      ),
    }
  }

  const resolved = await getEndpointProtocolClientService(endpointId)
  if (!resolved.ok) return resolved

  try {
    await resolved.data.client.deleteAccesses(
      resolved.data.endpointActualState,
      configs.map((config) => config.data),
    )
    return { ok: true, data: null }
  } catch (error) {
    return { ok: false, errorCode: "delete_failed", error }
  }
}
