import type { SupportedProtocolCode } from "@spurro/shared"
import { SupportedProtocolCodeSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { DeletableUserConfig } from "../queries/findDeletableUserConfigs.js"
import { findDeletableUserConfigs } from "../queries/findDeletableUserConfigs.js"
import { setUserConfigsStatus } from "../queries/setUserConfigsStatus.js"
import { deleteAmneziawg2ConfigsService } from "./deleteAmneziawg2ConfigsService.js"

type DeleteConfigsResult = { ok: true } | { ok: false; reason: "delete_failed" }

const deleteConfigsServiceBySupportedProtocolCode: Record<
  SupportedProtocolCode,
  (configs: DeletableUserConfig[]) => Promise<boolean>
> = {
  amneziawg2: deleteAmneziawg2ConfigsService,
}

export async function deleteUserConfigsService(
  userId: string,
  configIds: string[],
): Promise<DeleteConfigsResult> {
  const configs = await findDeletableUserConfigs(db, userId, configIds)

  const configsByEndpointId = new Map<string, DeletableUserConfig[]>()
  for (const config of configs) {
    const group = configsByEndpointId.get(config.endpointId)
    if (group) group.push(config)
    else configsByEndpointId.set(config.endpointId, [config])
  }

  let failed = false

  for (const group of configsByEndpointId.values()) {
    const [{ endpointId, protocolCode }] = group

    const parsedCode = SupportedProtocolCodeSchema.safeParse(protocolCode)
    if (!parsedCode.success) {
      console.error(
        `[config] endpoint ${endpointId} has unknown protocol "${protocolCode}"; configs not deleted`,
      )
      failed = true
      continue
    }

    const groupConfigIds = group.map((config) => config.id)

    await setUserConfigsStatus(db, userId, groupConfigIds, "deleting")

    const deleted = await deleteConfigsServiceBySupportedProtocolCode[parsedCode.data](group)
    if (!deleted) {
      failed = true
      continue
    }

    await setUserConfigsStatus(db, userId, groupConfigIds, "deleted", "deleting")
  }

  return failed ? { ok: false, reason: "delete_failed" } : { ok: true }
}
