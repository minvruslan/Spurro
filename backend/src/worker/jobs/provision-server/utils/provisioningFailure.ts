import { UnrecoverableError } from "bullmq"
import { workerLogger } from "@/core/logger/index.js"

export type ProvisioningErrorCode =
  | "server_not_found"
  | "invalid_server_data"
  | "invalid_server_desired_state"
  | "hardened_without_ssh_host_keys"
  | "no_desired_state_access"
  | "unknown_protocol"
  | "duplicate_protocol_endpoint"
  | "invalid_endpoint_data"
  | "invalid_endpoint_desired_state"

export function provisioningFailure(
  serverId: string,
  errorCode: ProvisioningErrorCode,
  details?: Record<string, unknown>,
): UnrecoverableError {
  workerLogger.error({ serverId, errorCode, ...details }, "Provisioning failed.")
  return new UnrecoverableError(`Server ${serverId} provisioning failed: ${errorCode}.`)
}
