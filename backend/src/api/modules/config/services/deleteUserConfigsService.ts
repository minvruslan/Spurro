import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import type { DeletableUserConfig } from "../queries/findDeletableUserConfigs.js"
import { findDeletableUserConfigs } from "../queries/findDeletableUserConfigs.js"
import { setUserConfigsStatus } from "../queries/setUserConfigsStatus.js"
import { deleteUserConfigsFromRemoteEndpointService } from "./deleteUserConfigsFromRemoteEndpointService.js"

type ErrorCode = "not_found" | "delete_failed"

export async function deleteUserConfigsService(
  userId: string,
  configIds?: string[],
): Promise<ServiceResult<{ deletedConfigIds: string[] }, ErrorCode>> {
  const configs = await findDeletableUserConfigs(db, userId, configIds)

  if (configIds && configs.length === 0) return { ok: false, reason: "not_found" }

  const configsByEndpointId = new Map<string, DeletableUserConfig[]>()
  for (const config of configs) {
    const group = configsByEndpointId.get(config.endpointId)
    if (group) group.push(config)
    else configsByEndpointId.set(config.endpointId, [config])
  }

  const errors: unknown[] = []
  const deletedConfigIds: string[] = []

  for (const [endpointId, group] of configsByEndpointId) {
    const groupConfigIds = group.map((config) => config.id)

    await setUserConfigsStatus(db, userId, groupConfigIds, "deleting")

    const deleted = await deleteUserConfigsFromRemoteEndpointService(endpointId, group)
    if (!deleted.ok) {
      errors.push(
        new Error(`Failed to delete configs on endpoint ${endpointId} (${deleted.reason}).`, {
          cause: deleted.error,
        }),
      )
      continue
    }

    const deletedRows = await setUserConfigsStatus(
      db,
      userId,
      groupConfigIds,
      "deleted",
      "deleting",
    )
    deletedConfigIds.push(...deletedRows.map((row) => row.id))
  }

  if (errors.length > 0) {
    return {
      ok: false,
      reason: "delete_failed",
      error: new AggregateError(errors, "Failed to delete configs on some endpoints."),
    }
  }

  return { ok: true, data: { deletedConfigIds } }
}
