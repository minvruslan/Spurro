import { UnrecoverableError } from "bullmq"
import { findServer } from "../queries/findServer.js"

export async function findProvisionableServer(serverId: string) {
  const server = await findServer(serverId)
  if (!server) {
    throw new UnrecoverableError(`[provision] server ${serverId} not found`)
  }

  const data = server.data
  if (!data?.ssh) {
    throw new UnrecoverableError(`[provision] server ${serverId} has no SSH credentials`)
  }

  return { ip: server.ip, domainName: server.domainName, data, ssh: data.ssh }
}
