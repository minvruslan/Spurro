import { RemoteServer } from "@spurro/infrastructure"
import type { ServerAccess } from "@spurro/infrastructure/types"
import type { ProvisioningStep } from "./ProvisioningStep.js"

export const hardenSSHAccess: ProvisioningStep<
  { currentAccess: ServerAccess; targetAccess: ServerAccess },
  void
> = async (serverId, { currentAccess, targetAccess }) => {
  if ("privateKey" in currentAccess) {
    await new RemoteServer(currentAccess).hardenSSHAccess(targetAccess.port)
    return
  }

  const preHardenAccess = { ...targetAccess, port: currentAccess.port }
  const preHardenServer = new RemoteServer(preHardenAccess)
  await preHardenServer.assertConnectivity()
  await preHardenServer.assertPrivilegeEscalation()
  await preHardenServer.hardenSSHAccess(targetAccess.port)
}
