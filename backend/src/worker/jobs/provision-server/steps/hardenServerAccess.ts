import { UnrecoverableError } from "bullmq"
import type { ServerAccess, ServerContract } from "@spurro/infrastructure/types"
import { RemoteServer } from "@spurro/infrastructure"
import { env } from "@/core/env/index.js"
import { updateServerData } from "../queries/updateServerData.js"
import type { findProvisionableServer } from "./findProvisionableServer.js"

type ProvisionableServer = Awaited<ReturnType<typeof findProvisionableServer>>

export async function hardenServerAccess(
  serverId: string,
  server: ProvisionableServer,
  serverContract: ServerContract,
  serverAccess: ServerAccess,
): Promise<ServerAccess> {
  const authorizedKeys = [await RemoteServer.deriveSSHPublicKey(env.APP_SSH_PRIVATE_KEY)]
  if (env.OPERATOR_SSH_PUBLIC_KEY) authorizedKeys.push(env.OPERATOR_SSH_PUBLIC_KEY)

  await new RemoteServer(serverAccess).installServiceUserAuthorizedKeys(
    serverContract.service.username,
    authorizedKeys,
  )

  const hardenedAccess = RemoteServer.buildServiceUserServerAccess(server, env.APP_SSH_PRIVATE_KEY)
  if (!hardenedAccess) {
    throw new UnrecoverableError(
      `Server ${serverId} has no contract or SSH host keys for service user access.`,
    )
  }

  if ("privateKey" in serverAccess) {
    await new RemoteServer(serverAccess).hardenSSHAccess(serverContract.sshPort)
  } else {
    const preHardenAccess = { ...hardenedAccess, port: serverAccess.port }
    const preHardenServer = new RemoteServer(preHardenAccess)
    await preHardenServer.assertConnectivity()
    await preHardenServer.assertPrivilegeEscalation()
    await preHardenServer.hardenSSHAccess(serverContract.sshPort)
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
