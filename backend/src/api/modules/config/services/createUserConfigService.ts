import { sql } from "drizzle-orm"
import type { Config, UpsertConfig } from "@spurro/api-contract"
import { ProtocolRegistry } from "@spurro/infrastructure/types"
import { isUserConfigLimitReachedService } from "@/api/modules/config-limit/index.js"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findActiveEndpointById } from "../queries/findActiveEndpointById.js"
import { setUserConfigsStatus } from "../queries/setUserConfigsStatus.js"
import { getEndpointProtocolClientService } from "./getEndpointProtocolClientService.js"
import { findConfigById } from "../queries/findConfigById.js"
import { findActiveDeviceTypeById } from "../queries/findActiveDeviceTypeById.js"
import { findReservedClientIdentifiers } from "../queries/findReservedClientIdentifiers.js"
import { insertUserConfig } from "../queries/insertUserConfig.js"
import { activateConfig } from "../queries/activateConfig.js"
import { createConfigFromDatabaseData } from "../utils/createConfigFromDatabaseData.js"

type ErrorCode =
  | "endpoint_invalid"
  | "device_type_invalid"
  | "unsupported_protocol"
  | "no_available_ip"
  | "limit_reached"
  | "failed"

export async function createUserConfigService(
  userId: string,
  input: UpsertConfig,
): Promise<ServiceResult<{ config: Config }, ErrorCode>> {
  const endpoint = await findActiveEndpointById(db, input.endpointId)
  if (!endpoint) return { ok: false, errorCode: "endpoint_invalid" }

  const deviceType = await findActiveDeviceTypeById(db, input.deviceTypeId)
  if (!deviceType) return { ok: false, errorCode: "device_type_invalid" }

  const resolved = await getEndpointProtocolClientService(endpoint.id)
  if (!resolved.ok) {
    return {
      ok: false,
      errorCode: resolved.errorCode === "unavailable" ? "failed" : resolved.errorCode,
      error: resolved.error,
    }
  }

  const { client, server, endpointActualState } = resolved.data

  const reserved = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`)
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${endpoint.serverId}))`)

    const limitCheck = await isUserConfigLimitReachedService(
      tx,
      userId,
      ProtocolRegistry[resolved.data.protocolCode].family,
    )

    if (limitCheck.data.limitReached) return "limit_reached" as const

    const reservedClientIdentifiers = await findReservedClientIdentifiers(tx, endpoint.serverId)

    const clientIdentifier = client.allocateClientIdentifier(
      endpointActualState,
      reservedClientIdentifiers,
    )

    if (!clientIdentifier) return "no_available_ip" as const

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

  if (typeof reserved === "string") return { ok: false, errorCode: reserved }

  const { configId, clientIdentifier } = reserved

  let created
  try {
    created = await client.createAccess(server, endpointActualState, clientIdentifier)

    const [activated] = await activateConfig(db, configId, created.configData)
    if (!activated) {
      throw new Error(`Config ${configId} was deleted while being created; access rolled back.`)
    }
  } catch (error) {
    try {
      await client.deleteAccessByClientIdentifier(endpointActualState, clientIdentifier)
    } catch (rollbackError) {
      return {
        ok: false,
        errorCode: "failed",
        error: new AggregateError(
          [error, rollbackError],
          "Access create failed and rollback delete failed; peer may be left on server.",
        ),
      }
    }

    await setUserConfigsStatus(db, userId, [configId], "deleted", "pending")

    return { ok: false, errorCode: "failed", error }
  }

  const rows = await findConfigById(db, configId)
  const config = createConfigFromDatabaseData(rows[0])

  return {
    ok: true,
    data: {
      config: {
        ...config,
        data: { ...created.configData, configuration: created.clientConfiguration },
      },
    },
  }
}
