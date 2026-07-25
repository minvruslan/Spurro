import { UnrecoverableError } from "bullmq"
import { findServer } from "../queries/findServer.js"

export async function findProvisionableServer(serverId: string) {
  const server = await findServer(serverId)
  if (!server) {
    throw new UnrecoverableError(`Server ${serverId} not found.`)
  }
  if (!server.data) {
    throw new UnrecoverableError(`Server ${serverId} has missing or invalid data.`)
  }

  return { ip: server.ip, domainName: server.domainName, data: server.data }
}
