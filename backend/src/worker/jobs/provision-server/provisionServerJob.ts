import type { ProvisionServerJob } from "@/core/queue/provision-server/index.js"
import { updateServerStatus } from "./queries/updateServerStatus.js"
import { findProvisionableServer } from "./steps/findProvisionableServer.js"
import { ensureServerContract } from "./steps/ensureServerContract.js"
import { ensureEndpointContracts } from "./steps/ensureEndpointContracts.js"
import { deployEndpoints } from "./steps/deployEndpoints.js"

export async function provisionServerJob(job: ProvisionServerJob) {
  const { serverId } = job

  const server = await findProvisionableServer(serverId)
  const serverContract = await ensureServerContract(serverId, server)
  const deployments = await ensureEndpointContracts(serverId)

  const serverAccess = { ip: server.ip, login: server.ssh.login, password: server.ssh.password }

  await deployEndpoints(serverAccess, serverContract, deployments)

  await updateServerStatus(serverId, "active")
}
