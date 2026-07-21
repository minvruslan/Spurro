import { sql } from "drizzle-orm"
import type { UpsertConfig } from "@spurro/shared"
import { ConfigSchema, SupportedProtocolCodeSchema } from "@spurro/shared"
import { RemoteServer } from "@spurro/infrastructure"
import {
  findEndpointAccessService,
  setUserConfigsStatus,
} from "@/api/modules/common/config/index.js"
import { db } from "@/core/database/index.js"
import { findActiveEndpointById } from "../queries/findActiveEndpointById.js"
import { findConfigById } from "../queries/findConfigById.js"
import { findDeviceTypeById } from "../queries/findDeviceTypeById.js"
import { findReservedClientIdentifiers } from "../queries/findReservedClientIdentifiers.js"
import { insertUserConfig } from "../queries/insertUserConfig.js"
import { updateConfigData } from "../queries/updateConfigData.js"
import type { CreateConfigResult } from "../types/CreateConfigResult.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

export async function createUserConfigService(
  userId: string,
  input: UpsertConfig,
): Promise<CreateConfigResult> {
  const endpoint = await findActiveEndpointById(db, input.endpointId)
  if (!endpoint) return { ok: false, reason: "endpoint_invalid" }

  const deviceType = await findDeviceTypeById(db, input.deviceTypeId)
  if (!deviceType) return { ok: false, reason: "device_type_invalid" }

  const parsedCode = SupportedProtocolCodeSchema.safeParse(endpoint.protocolCode)
  if (!parsedCode.success) return { ok: false, reason: "unsupported_protocol" }

  const access = await findEndpointAccessService(endpoint.serverId, endpoint.id)
  if (!access) return { ok: false, reason: "failed" }

  const client = new RemoteServer(access.serverAccess).getProtocolClient(parsedCode.data)

  const { revision } = access.endpointContract
  if (client.assessRevisionCompatibility(revision) !== "supported") {
    console.error(
      `[config] endpoint ${endpoint.id} server revision ${revision ?? "unknown"} is outside the supported range [${client.clientSupportedRevision}, ${client.clientRevision}]; re-provision the server`,
    )
    return { ok: false, reason: "failed" }
  }

  const reserved = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${endpoint.serverId}))`)
    const reservedClientIdentifiers = await findReservedClientIdentifiers(tx, endpoint.serverId)

    const clientIdentifier = client.allocateClientIdentifier(
      access.endpointContract,
      reservedClientIdentifiers,
    )

    if (!clientIdentifier) return null

    const [row] = await insertUserConfig(tx, {
      userId,
      endpointId: input.endpointId,
      deviceTypeId: input.deviceTypeId,
      name: input.name,
      data: client.createInitialConfigData(clientIdentifier),
      clientIdentifier,
    })

    return { configId: row.id, clientIdentifier }
  })

  if (!reserved) return { ok: false, reason: "no_available_ip" }

  const { configId, clientIdentifier } = reserved

  try {
    const created = await client.createAccess(
      access.serverContract,
      access.endpointContract,
      clientIdentifier,
    )

    // TODO: temporary, remove — logs the generated client VPN config for testing
    console.log(`[config][DEBUG] user ${userId} config ${configId}\n${created.clientConfiguration}`)

    await updateConfigData(db, configId, created.configData)

    const rows = await findConfigById(db, configId)
    const config = createConfigFromDatabaseData(rows[0])

    return {
      ok: true,
      data: ConfigSchema.parse({
        ...config,
        data: { ...created.configData, configuration: created.clientConfiguration },
      }),
    }
  } catch (error) {
    console.error("[config] config creation failed", error)

    let deleted = false
    try {
      await client.deleteAccessByClientIdentifier(access.endpointContract, clientIdentifier)
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
