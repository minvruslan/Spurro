import { SupportedProtocolCodeSchema } from "@spurro/shared"
import { RemoteServer } from "@spurro/infrastructure"
import type { DeletableUserConfig } from "../queries/findDeletableUserConfigs.js"
import { findEndpointAccessService } from "./findEndpointAccessService.js"

export async function deleteConfigsService(configs: DeletableUserConfig[]): Promise<boolean> {
  const [{ serverId, endpointId, protocolCode }] = configs

  const parsedCode = SupportedProtocolCodeSchema.safeParse(protocolCode)
  if (!parsedCode.success) {
    console.error(
      `[config] endpoint ${endpointId} has unknown protocol "${protocolCode}"; configs not deleted`,
    )
    return false
  }

  const access = await findEndpointAccessService(serverId, endpointId)
  if (!access) return false

  const client = new RemoteServer(access.serverAccess).getProtocolClient(parsedCode.data)

  const { revision } = access.endpointContract
  if (client.assessRevisionCompatibility(revision) !== "supported") {
    console.error(
      `[config] endpoint ${endpointId} server revision ${revision ?? "unknown"} is outside the supported range [${client.clientSupportedRevision}, ${client.clientRevision}]; accesses left on server`,
    )
    return false
  }

  try {
    await client.deleteAccesses(
      access.endpointContract,
      configs.map((config) => config.data),
    )
    return true
  } catch (error) {
    console.error("[config] access delete failed; accesses may be left on server", error)
    return false
  }
}
