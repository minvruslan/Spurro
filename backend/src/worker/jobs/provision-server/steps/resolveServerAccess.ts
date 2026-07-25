import { UnrecoverableError } from "bullmq"
import type { ServerAccess, ServerContract } from "@spurro/infrastructure/types"
import { RemoteServer, buildServerAccess, buildServiceUserAccess } from "@spurro/infrastructure"
import { env } from "@/core/env/index.js"
import type { findProvisionableServer } from "./findProvisionableServer.js"

type ProvisionableServer = Awaited<ReturnType<typeof findProvisionableServer>>

export async function resolveServerAccess(
  serverId: string,
  server: ProvisionableServer,
  serverContract: ServerContract,
  sshHostKeys: string[],
): Promise<ServerAccess> {
  const access = buildServerAccess(server, env.APP_SSH_PRIVATE_KEY)
  if (access && "privateKey" in access) return access

  const serviceUserAccess = buildServiceUserAccess(
    server.ip,
    serverContract,
    sshHostKeys,
    serverContract.sshPort,
    env.APP_SSH_PRIVATE_KEY,
  )
  try {
    await new RemoteServer(serviceUserAccess).assertConnectivity()
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
