import { UnrecoverableError } from "bullmq"

type ProvisioningErrorCode =
  | "server_not_found"
  | "invalid_server_data"
  | "invalid_server_desired_state"
  | "hardened_without_ssh_host_keys"
  | "no_desired_state_access"
  | "unknown_protocol"
  | "invalid_endpoint_data"
  | "invalid_endpoint_desired_state"

export class ProvisioningError extends UnrecoverableError {
  constructor(
    readonly serverId: string,
    readonly errorCode: ProvisioningErrorCode,
    readonly error?: unknown,
  ) {
    super(`Server ${serverId} provisioning failed: ${errorCode}.`)
  }
}
