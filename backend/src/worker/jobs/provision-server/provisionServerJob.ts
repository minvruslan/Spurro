import { ServerProvisioner } from "@spurro/infrastructure"
import type { ProvisionServerJob } from "@/core/queue/provision-server/index.js"
import { updateServerStatus } from "./queries/updateServerStatus.js"
import { findProvisionableServer } from "./steps/findProvisionableServer.js"
import { ensureServerContract } from "./steps/ensureServerContract.js"
import { ensureSSHHostKeys } from "./steps/ensureSSHHostKeys.js"
import { resolveServerAccess } from "./steps/resolveServerAccess.js"
import { hardenServerAccess } from "./steps/hardenServerAccess.js"
import { ensureEndpointContracts } from "./steps/ensureEndpointContracts.js"
import { deployEndpoints } from "./steps/deployEndpoints.js"

export async function provisionServerJob(job: ProvisionServerJob) {
  const { serverId } = job

  const server = await findProvisionableServer(serverId)
  const serverContract = await ensureServerContract(serverId, server)
  const sshHostKeys = await ensureSSHHostKeys(serverId, server)
  const serverAccess = await resolveServerAccess(serverId, server, serverContract, sshHostKeys)

  await new ServerProvisioner(serverAccess).bootstrap(
    serverContract.service.username,
    serverContract.service.baseDirectory,
  )

  const serviceUserAccess = await hardenServerAccess(
    serverId,
    server,
    serverContract,
    sshHostKeys,
    serverAccess,
  )

  const deployments = await ensureEndpointContracts(serverId)
  await deployEndpoints(serviceUserAccess, serverContract, deployments)

  await updateServerStatus(serverId, "active")
}
