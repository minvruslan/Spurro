import { UnrecoverableError } from "bullmq"
import type { ServerAccess, ServerContract } from "@spurro/shared/infrastructure"
import { ServerProvisioner } from "@spurro/infrastructure"
import { buildServerAccess, buildServiceUserAccess } from "@/core/server-access/index.js"
import type { findProvisionableServer } from "./findProvisionableServer.js"

type ProvisionableServer = Awaited<ReturnType<typeof findProvisionableServer>>

export async function resolveServerAccess(
  serverId: string,
  server: ProvisionableServer,
  serverContract: ServerContract,
  sshHostKeys: string[],
): Promise<ServerAccess> {
  const access = buildServerAccess(server)
  if (access && "privateKey" in access) return access

  const serviceUserAccess = buildServiceUserAccess(
    server.ip,
    serverContract,
    sshHostKeys,
    serverContract.sshPort,
  )
  try {
    await new ServerProvisioner(serviceUserAccess).assertConnectivity()
    return serviceUserAccess
  } catch {
    if (!access) {
      throw new UnrecoverableError(
        `[provision] server ${serverId} has neither working key access nor bootstrap credentials`,
      )
    }
    return access
  }
}
