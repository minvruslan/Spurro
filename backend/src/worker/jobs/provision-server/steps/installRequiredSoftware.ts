import type { RemoteServer } from "@vancloak/infrastructure"
import type { ProvisioningStep } from "./ProvisioningStep.js"

export const installRequiredSoftware: ProvisioningStep<
  { remoteServer: RemoteServer },
  void
> = async (serverId, { remoteServer }) => {
  await remoteServer.installDocker()
}
