import { RemoteServer } from "@spurro/infrastructure"
import type { ServerSSH } from "@spurro/infrastructure/types"
import { ProvisioningError } from "../ProvisioningError.js"
import type { ProvisioningStep } from "./ProvisioningStep.js"

export const scanSSHHostKeys: ProvisioningStep<{ ip: string; ssh: ServerSSH }, string[]> = async (
  serverId,
  { ip, ssh },
) => {
  if (ssh.type === "privateKey") {
    throw new ProvisioningError(serverId, "hardened_without_ssh_host_keys")
  }

  return RemoteServer.scanSSHHostKeys(ip, ssh.port)
}
