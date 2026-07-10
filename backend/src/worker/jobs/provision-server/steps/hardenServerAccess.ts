import type { ServerAccess, ServerContract } from "@spurro/shared/infrastructure"
import { ServerProvisioner } from "@spurro/infrastructure"
import { env } from "@/core/env/index.js"
import { BOOTSTRAP_SSH_PORT, buildServiceUserAccess } from "@/core/server-access/index.js"
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
  const authorizedKeys = [await ServerProvisioner.deriveSSHPublicKey(env.APP_SSH_PRIVATE_KEY)]
  if (env.OPERATOR_SSH_PUBLIC_KEY) authorizedKeys.push(env.OPERATOR_SSH_PUBLIC_KEY)

  await new ServerProvisioner(serverAccess).installServiceUserAuthorizedKeys(
    serverContract.service.username,
    authorizedKeys,
  )

  const hardenedAccess = buildServiceUserAccess(
    server.ip,
    serverContract,
    sshHostKeys,
    serverContract.sshPort,
  )

  if ("privateKey" in serverAccess) {
    await new ServerProvisioner(serverAccess).harden(serverContract.sshPort)
  } else {
    const preHardenAccess = buildServiceUserAccess(
      server.ip,
      serverContract,
      sshHostKeys,
      BOOTSTRAP_SSH_PORT,
    )
    const preHardenProvisioner = new ServerProvisioner(preHardenAccess)
    await preHardenProvisioner.assertConnectivity()
    await preHardenProvisioner.assertPrivilegeEscalation()
    await preHardenProvisioner.harden(serverContract.sshPort)
  }

  await new ServerProvisioner(hardenedAccess).assertConnectivity()

  if (!("hardenedAt" in server.data.ssh)) {
    const data = { ...server.data, ssh: { hardenedAt: new Date().toISOString() } }
    await updateServerData(serverId, data)
    server.data = data
  }

  return hardenedAccess
}
