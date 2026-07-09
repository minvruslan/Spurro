import {
  ServerContractSchema,
  type EndpointContract,
  type ServerAccess,
  type ServerContract,
} from "@spurro/shared/infrastructure"
import { db } from "@/core/database/index.js"
import { findEndpointData } from "../queries/findEndpointData.js"
import { findServerAccess } from "../queries/findServerAccess.js"

export async function findEndpointAccessService(
  serverId: string,
  endpointId: string,
): Promise<{
  serverAccess: ServerAccess
  serverContract: ServerContract
  endpointContract: EndpointContract
} | null> {
  const access = await findServerAccess(db, serverId)
  const ssh = access?.data?.ssh
  const serverContract = access?.data?.contract
  if (!ssh || !serverContract) return null

  const endpointData = await findEndpointData(db, endpointId)
  const endpointContract = endpointData?.data?.contract
  if (!endpointContract) return null

  return {
    serverAccess: { ip: access.ip, login: ssh.login, password: ssh.password },
    serverContract: ServerContractSchema.parse(serverContract),
    endpointContract,
  }
}
