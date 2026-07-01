import type { UpsertConfig } from "@spurro/shared"
import { AMNEZIAWG_PROTOCOL_CODE, ConfigSchema } from "@spurro/shared"
import { AmneziawgClient } from "@spurro/infrastructure"
import { db } from "@/core/database/index.js"
import { deleteUserConfig } from "../queries/deleteUserConfig.js"
import type { findActiveEndpointById } from "../queries/findActiveEndpointById.js"
import { findConfigById } from "../queries/findConfigById.js"
import { findServerAccess } from "../queries/findServerAccess.js"
import { insertUserConfig } from "../queries/insertUserConfig.js"
import { updateConfigData } from "../queries/updateConfigData.js"
import type { AmneziawgPeerConfig } from "../types/AmneziawgPeerConfig.js"
import type { CreateConfigResult } from "../types/CreateConfigResult.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"
import { allocateClientIPService } from "./allocateClientIPService.js"

export async function createUserAmneziawgConfigService(
  userId: string,
  input: UpsertConfig,
  endpoint: NonNullable<Awaited<ReturnType<typeof findActiveEndpointById>>>,
): Promise<CreateConfigResult> {
  const access = await findServerAccess(db, endpoint.serverId)
  const ssh = access?.data?.ssh

  if (!ssh) return { ok: false, reason: "failed" }

  const reserved = await db.transaction(async (tx) => {
    const clientIP = await allocateClientIPService(tx, endpoint.serverId)
    if (!clientIP) return null

    const [row] = await insertUserConfig(tx, {
      userId,
      endpointId: input.endpointId,
      deviceTypeId: input.deviceTypeId,
      name: input.name,
      data: { protocol: AMNEZIAWG_PROTOCOL_CODE, ip: clientIP },
    })

    return { configId: row.id, clientIP }
  })

  if (!reserved) return { ok: false, reason: "no_available_ip" }

  const { configId, clientIP } = reserved
  const client = new AmneziawgClient({ ip: access.ip, login: ssh.login, password: ssh.password })

  try {
    const peer = await client.addPeer({
      ip: clientIP,
      endpoint: `${endpoint.serverDomainName}:${endpoint.port}`,
      name: input.name,
    })

    const peerConfig: AmneziawgPeerConfig = {
      protocol: AMNEZIAWG_PROTOCOL_CODE,
      ip: peer.ip,
      publicKey: peer.publicKey,
      privateKey: peer.privateKey,
      configuration: peer.configuration,
    }

    await updateConfigData(db, configId, peerConfig)
  } catch (error) {
    console.error("[config] AmneziaWG config creation failed", error)

    await client.removePeerByClientIP(clientIP).catch(() => {})
    await deleteUserConfig(db, userId, configId).catch(() => {})

    return { ok: false, reason: "failed" }
  }

  const rows = await findConfigById(db, configId)

  return { ok: true, data: ConfigSchema.parse(createConfigFromDatabaseData(rows[0])) }
}
