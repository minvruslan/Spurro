import { db } from "@/core/database/index.js"
import { configLogger } from "@/core/logger/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import type { DeletableUserConfig } from "../queries/findDeletableUserConfigs.js"
import { findDeletableUserConfigs } from "../queries/findDeletableUserConfigs.js"
import { setUserConfigsStatus } from "../queries/setUserConfigsStatus.js"
import { deleteUserConfigsFromRemoteEndpointService } from "./deleteUserConfigsFromRemoteEndpointService.js"

export async function deleteUserConfigsService(
  userId: string,
  configIds?: string[],
): Promise<
  ServiceResult<{ deletedConfigIds: string[]; deleteFailedConfigIds: string[] }, "not_found">
> {
  const configs = await findDeletableUserConfigs(db, userId, configIds)

  if (configIds && configs.length === 0) return { ok: false, reason: "not_found" }

  const configsByEndpointId = new Map<string, DeletableUserConfig[]>()
  for (const config of configs) {
    const group = configsByEndpointId.get(config.endpointId)
    if (group) group.push(config)
    else configsByEndpointId.set(config.endpointId, [config])
  }

  const deletedConfigIds: string[] = []
  const deleteFailedConfigIds: string[] = []

  for (const [endpointId, group] of configsByEndpointId) {
    const groupConfigIds = group.map((config) => config.id)

    await setUserConfigsStatus(db, userId, groupConfigIds, "deleting")

    const deleted = await deleteUserConfigsFromRemoteEndpointService(endpointId, group)
    if (!deleted.ok) {
      configLogger.error(
        { endpointId, configIds: groupConfigIds, reason: deleted.reason, error: deleted.error },
        "Failed to delete configs on endpoint.",
      )
      deleteFailedConfigIds.push(...groupConfigIds)
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

  return { ok: true, data: { deletedConfigIds, deleteFailedConfigIds } }
}
