import type { RemoteServer } from "@spurro/infrastructure"
import type { ServerDesiredState } from "@spurro/infrastructure/types"
import type { ProvisioningStep } from "./ProvisioningStep.js"

export const createServiceUserAccess: ProvisioningStep<
  { remoteServer: RemoteServer; desiredState: ServerDesiredState; authorizedKeys: string[] },
  void
> = async (serverId, { remoteServer, desiredState, authorizedKeys }) => {
  await remoteServer.createServiceUser(desiredState.ssh.username, desiredState.baseDirectory)
  await remoteServer.installServiceUserAuthorizedKeys(desiredState.ssh.username, authorizedKeys)
}
