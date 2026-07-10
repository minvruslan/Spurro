import {
  ServerContractSchema,
  type EndpointContract,
  type ServerAccess,
  type ServerContract,
} from "@spurro/shared/infrastructure"
import { db } from "@/core/database/index.js"
import { buildServerAccess } from "@/core/server-access/index.js"
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
  if (!access) return null

  const serverAccess = buildServerAccess(access)
  const serverContract = access.data?.contract
  if (!serverAccess || !serverContract) return null

  const endpointData = await findEndpointData(db, endpointId)
  const endpointContract = endpointData?.data?.contract
  if (!endpointContract) return null

  return {
    serverAccess,
    serverContract: ServerContractSchema.parse(serverContract),
    endpointContract,
  }
}
