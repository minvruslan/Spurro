import { UnrecoverableError } from "bullmq"
import type { ServerAccess } from "@spurro/infrastructure/types"
import { RemoteServer } from "@spurro/infrastructure"
import { env } from "@/core/env/index.js"
import type { findProvisionableServer } from "./findProvisionableServer.js"

type ProvisionableServer = Awaited<ReturnType<typeof findProvisionableServer>>

export async function resolveServerAccess(
  serverId: string,
  server: ProvisionableServer,
): Promise<ServerAccess> {
  const access = RemoteServer.buildServerAccess(server, env.APP_SSH_PRIVATE_KEY)
  if (access && "privateKey" in access) return access

  const serviceUserAccess = RemoteServer.buildServiceUserServerAccess(
    server,
    env.APP_SSH_PRIVATE_KEY,
  )
  if (!serviceUserAccess) {
    throw new UnrecoverableError(
      `Server ${serverId} has no contract or SSH host keys for service user access.`,
    )
  }

  try {
    await new RemoteServer(serviceUserAccess).assertConnectivity()
    return serviceUserAccess
  } catch {
    if (!access) {
      throw new UnrecoverableError(
        `Server ${serverId} has neither working key access nor bootstrap credentials.`,
      )
    }
    return access
  }
}
