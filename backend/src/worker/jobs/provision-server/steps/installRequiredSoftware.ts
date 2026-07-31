import type { RemoteServer } from "@spurro/infrastructure"
import type { ProvisioningStep } from "./ProvisioningStep.js"

export const installRequiredSoftware: ProvisioningStep<
  { remoteServer: RemoteServer },
  void
> = async (serverId, { remoteServer }) => {
  await remoteServer.installDocker()
}
