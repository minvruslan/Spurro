import type { Amneziawg2ConfigData } from "@spurro/shared"
import { Amneziawg2ProtocolClient, PROTOCOL_CLIENTS } from "@spurro/infrastructure"
import type { DeletableUserConfig } from "../queries/findDeletableUserConfigs.js"
import { findEndpointAccessService } from "./findEndpointAccessService.js"

export async function deleteAmneziawg2ConfigsService(
  configs: DeletableUserConfig[],
): Promise<boolean> {
  const clientPublicKeys = configs
    .map((config) => (config.data as Amneziawg2ConfigData | null)?.publicKey)
    .filter((publicKey): publicKey is string => Boolean(publicKey))

  if (clientPublicKeys.length === 0) return true

  const [{ serverId, endpointId }] = configs

  const access = await findEndpointAccessService(serverId, endpointId)
  if (!access) return false

  const client = PROTOCOL_CLIENTS.amneziawg2
  const { revision } = access.endpointContract

  if (client.assessRevisionCompatibility(revision) !== "supported") {
    console.error(
      `[config] endpoint ${endpointId} server revision ${revision ?? "unknown"} is outside the supported range [${client.clientSupportedRevision}, ${client.clientRevision}]; peers left on server`,
    )
    return false
  }

  try {
    await client.deleteAccesses(
      access.serverAccess,
      Amneziawg2ProtocolClient.parseEndpointContract(access.endpointContract),
      clientPublicKeys,
    )
    return true
  } catch (error) {
    console.error("[config] peer delete failed; peers may be left on server", error)
    return false
  }
}
