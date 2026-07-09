import { db } from "@/core/database/index.js"
import { findDeletableUserConfigs } from "../queries/findDeletableUserConfigs.js"
import { deleteUserConfigsService } from "./deleteUserConfigsService.js"

type DeleteConfigResult = { ok: true } | { ok: false; reason: "not_found" | "delete_failed" }

export async function deleteUserConfigService(
  userId: string,
  configId: string,
): Promise<DeleteConfigResult> {
  const [config] = await findDeletableUserConfigs(db, userId, [configId])
  if (!config) return { ok: false, reason: "not_found" }

  return deleteUserConfigsService(userId, [configId])
}
