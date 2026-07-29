import { RemoteServer } from "@spurro/infrastructure"
import type { ServerAccess, ServerData } from "@spurro/infrastructure/types"
import { ProvisioningError } from "../ProvisioningError.js"
import type { ProvisioningStep } from "./ProvisioningStep.js"

type ResolveServerAccessResult = {
  currentAccess: ServerAccess
  targetAccess: ServerAccess
}

export const resolveServerAccess: ProvisioningStep<
  { ip: string; serverData: ServerData; appSSHPrivateKey: string },
  ResolveServerAccessResult
> = async (serverId, { ip, serverData, appSSHPrivateKey }) => {
  const actualStateAccess = RemoteServer.buildServerAccessFromActualState(
    { ip, data: serverData },
    appSSHPrivateKey,
  )
  if (!actualStateAccess) {
    throw new ProvisioningError(serverId, "hardened_without_ssh_host_keys")
  }

  const desiredStateAccess = RemoteServer.buildServerAccessFromDesiredState(
    { ip, data: serverData },
    appSSHPrivateKey,
  )
  if (!desiredStateAccess) {
    throw new ProvisioningError(serverId, "no_desired_state_access")
  }

  if ("privateKey" in actualStateAccess) {
    return { currentAccess: actualStateAccess, targetAccess: desiredStateAccess }
  }

  try {
    await new RemoteServer(desiredStateAccess).assertConnectivity()
    return { currentAccess: desiredStateAccess, targetAccess: desiredStateAccess }
  } catch {
    return { currentAccess: actualStateAccess, targetAccess: desiredStateAccess }
  }
}
