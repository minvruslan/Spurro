import type { Amneziawg2ConfigData, UpsertConfig } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { Amneziawg2ProtocolClient, PROTOCOL_CLIENTS } from "@spurro/infrastructure"
import {
  findEndpointAccessService,
  setUserConfigsStatus,
} from "@/api/modules/common/config/index.js"
import { db } from "@/core/database/index.js"
import type { findActiveEndpointById } from "../queries/findActiveEndpointById.js"
import { findConfigById } from "../queries/findConfigById.js"
import { insertUserConfig } from "../queries/insertUserConfig.js"
import { updateConfigData } from "../queries/updateConfigData.js"
import type { CreateConfigResult } from "../types/CreateConfigResult.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"
import { allocateClientIPService } from "./allocateClientIPService.js"

export async function createUserAmneziawg2ConfigService(
  userId: string,
  input: UpsertConfig,
  endpoint: NonNullable<Awaited<ReturnType<typeof findActiveEndpointById>>>,
): Promise<CreateConfigResult> {
  const access = await findEndpointAccessService(endpoint.serverId, endpoint.id)
  if (!access) return { ok: false, reason: "failed" }
  const { serverAccess } = access

  const client = PROTOCOL_CLIENTS.amneziawg2

  const { revision } = access.endpointContract
  if (client.assessRevisionCompatibility(revision) !== "supported") {
    console.error(
      `[config] endpoint ${endpoint.id} server revision ${revision ?? "unknown"} is outside the supported range [${client.clientSupportedRevision}, ${client.clientRevision}]; re-provision the server`,
    )
    return { ok: false, reason: "failed" }
  }

  const contract = Amneziawg2ProtocolClient.assertEndpointContract(access.endpointContract)

  const reserved = await db.transaction(async (tx) => {
    const clientIP = await allocateClientIPService(tx, endpoint.serverId, contract.subnetPrefix)
    if (!clientIP) return null

    const [row] = await insertUserConfig(tx, {
      userId,
      endpointId: input.endpointId,
      deviceTypeId: input.deviceTypeId,
      name: input.name,
      data: { protocolCode: client.protocolCode, ip: clientIP },
    })

    return { configId: row.id, clientIP }
  })

  if (!reserved) return { ok: false, reason: "no_available_ip" }

  const { configId, clientIP } = reserved

  try {
    const created = await client.createAccess(
      serverAccess,
      access.serverContract,
      contract,
      clientIP,
    )

    // TODO: temporary, remove — logs the generated client VPN config for testing
    console.log(`[config][DEBUG] user ${userId} config ${configId}\n${created.clientConfiguration}`)

    const peerConfig: Amneziawg2ConfigData = {
      protocolCode: client.protocolCode,
      ip: created.clientIP,
      publicKey: created.clientPublicKey,
      presharedKey: created.presharedKey,
    }

    await updateConfigData(db, configId, peerConfig)

    const rows = await findConfigById(db, configId)
    const config = createConfigFromDatabaseData(rows[0])

    return {
      ok: true,
      data: ConfigSchema.parse({
        ...config,
        data: { ...peerConfig, configuration: created.clientConfiguration },
      }),
    }
  } catch (error) {
    console.error("[config] AmneziaWG 2 config creation failed", error)

    let deleted = false
    try {
      await client.deleteAccess(serverAccess, contract, { clientIP })
      deleted = true
    } catch (deleteError) {
      console.error("[config] rollback delete failed; peer may be left on server", deleteError)
    }

    if (deleted) {
      await setUserConfigsStatus(db, userId, [configId], "deleted", "pending").catch(() => {})
    }

    return { ok: false, reason: "failed" }
  }
}
