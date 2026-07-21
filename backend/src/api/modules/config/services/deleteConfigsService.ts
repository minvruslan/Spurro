import { SupportedProtocolCodeSchema } from "@spurro/shared"
import type { DeletableUserConfig } from "../queries/findDeletableUserConfigs.js"
import { getEndpointProtocolClientService } from "./getEndpointProtocolClientService.js"

export async function deleteConfigsService(configs: DeletableUserConfig[]): Promise<boolean> {
  const [{ serverId, endpointId, protocolCode }] = configs

  const parsedCode = SupportedProtocolCodeSchema.safeParse(protocolCode)
  if (!parsedCode.success) {
    console.error(
      `[config] endpoint ${endpointId} has unknown protocol "${protocolCode}"; configs not deleted`,
    )
    return false
  }

  const resolved = await getEndpointProtocolClientService(serverId, endpointId, parsedCode.data)
  if (!resolved.ok) return false

  try {
    await resolved.client.deleteAccesses(
      resolved.endpointContract,
      configs.map((config) => config.data),
    )
    return true
  } catch (error) {
    console.error("[config] access delete failed; accesses may be left on server", error)
    return false
  }
}
