import type { ServerAccess, ServerContract } from "../types/index.js"

export function buildServiceUserAccess(
  ip: string,
  serverContract: ServerContract,
  sshHostKeys: string[],
  port: number,
  appSshPrivateKey: string,
): ServerAccess {
  return {
    ip,
    port,
    username: serverContract.service.username,
    privateKey: appSshPrivateKey,
    sshHostKeys,
  }
}
