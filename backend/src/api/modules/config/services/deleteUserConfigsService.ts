import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import type { DeletableUserConfig } from "../queries/findDeletableUserConfigs.js"
import { findDeletableUserConfigs } from "../queries/findDeletableUserConfigs.js"
import { setUserConfigsStatus } from "../queries/setUserConfigsStatus.js"
import { deleteConfigsService } from "./deleteConfigsService.js"

type DeleteConfigsResult = ServiceResult<{ deletedConfigIds: string[] }, "delete_failed">

export async function deleteUserConfigsService(
  userId: string,
  configIds?: string[],
): Promise<DeleteConfigsResult> {
  const configs = await findDeletableUserConfigs(db, userId, configIds)

  const configsByEndpointId = new Map<string, DeletableUserConfig[]>()
  for (const config of configs) {
    const group = configsByEndpointId.get(config.endpointId)
    if (group) group.push(config)
    else configsByEndpointId.set(config.endpointId, [config])
  }

  let failed = false
  const deletedConfigIds: string[] = []

  for (const group of configsByEndpointId.values()) {
    const groupConfigIds = group.map((config) => config.id)

    await setUserConfigsStatus(db, userId, groupConfigIds, "deleting")

    const deleted = await deleteConfigsService(group)
    if (!deleted) {
      failed = true
      continue
    }

    await setUserConfigsStatus(db, userId, groupConfigIds, "deleted", "deleting")
    deletedConfigIds.push(...groupConfigIds)
  }

  return failed ? { ok: false, reason: "delete_failed" } : { ok: true, deletedConfigIds }
}
