import type { ServerAccess, ServerContract } from "@spurro/shared/infrastructure"
import { env } from "@/core/env/index.js"

export function buildServiceUserAccess(
  ip: string,
  serverContract: ServerContract,
  sshHostKeys: string[],
  port: number,
): ServerAccess {
  return {
    ip,
    port,
    username: serverContract.service.username,
    privateKey: env.APP_SSH_PRIVATE_KEY,
    sshHostKeys,
  }
}
