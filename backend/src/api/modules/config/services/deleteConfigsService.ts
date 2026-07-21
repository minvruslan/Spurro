import { configLogger } from "@/core/logger/index.js"
import { SupportedProtocolCodeSchema } from "@spurro/shared"
import type { DeletableUserConfig } from "../queries/findDeletableUserConfigs.js"
import { getEndpointProtocolClientService } from "./getEndpointProtocolClientService.js"

export async function deleteConfigsService(configs: DeletableUserConfig[]): Promise<boolean> {
  const [{ serverId, endpointId, protocolCode }] = configs

  const parsedCode = SupportedProtocolCodeSchema.safeParse(protocolCode)
  if (!parsedCode.success) {
    configLogger.error(
      `Endpoint ${endpointId} has unknown protocol "${protocolCode}"; configs not deleted.`,
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
    configLogger.error({ error }, "Access delete failed; accesses may be left on server.")
    return false
  }
}
