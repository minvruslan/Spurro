import type { ServerAccess, ServerContract } from "@spurro/infrastructure/types"
import { RemoteServer, BOOTSTRAP_SSH_PORT, buildServiceUserAccess } from "@spurro/infrastructure"
import { env } from "@/core/env/index.js"
import { updateServerData } from "../queries/updateServerData.js"
import type { findProvisionableServer } from "./findProvisionableServer.js"

type ProvisionableServer = Awaited<ReturnType<typeof findProvisionableServer>>

export async function hardenServerAccess(
  serverId: string,
  server: ProvisionableServer,
  serverContract: ServerContract,
  sshHostKeys: string[],
  serverAccess: ServerAccess,
): Promise<ServerAccess> {
  const authorizedKeys = [await RemoteServer.deriveSSHPublicKey(env.APP_SSH_PRIVATE_KEY)]
  if (env.OPERATOR_SSH_PUBLIC_KEY) authorizedKeys.push(env.OPERATOR_SSH_PUBLIC_KEY)

  await new RemoteServer(serverAccess).installServiceUserAuthorizedKeys(
    serverContract.service.username,
    authorizedKeys,
  )

  const hardenedAccess = buildServiceUserAccess(
    server.ip,
    serverContract,
    sshHostKeys,
    serverContract.sshPort,
    env.APP_SSH_PRIVATE_KEY,
  )

  if ("privateKey" in serverAccess) {
    await new RemoteServer(serverAccess).harden(serverContract.sshPort)
  } else {
    const preHardenAccess = buildServiceUserAccess(
      server.ip,
      serverContract,
      sshHostKeys,
      BOOTSTRAP_SSH_PORT,
      env.APP_SSH_PRIVATE_KEY,
    )
    const preHardenServer = new RemoteServer(preHardenAccess)
    await preHardenServer.assertConnectivity()
    await preHardenServer.assertPrivilegeEscalation()
    await preHardenServer.harden(serverContract.sshPort)
  }

  await new RemoteServer(hardenedAccess).assertConnectivity()

  if (!("hardenedAt" in server.data.state.ssh)) {
    const data = {
      ...server.data,
      state: { ...server.data.state, ssh: { hardenedAt: new Date().toISOString() } },
    }
    await updateServerData(serverId, data)
    server.data = data
  }

  return hardenedAccess
}
