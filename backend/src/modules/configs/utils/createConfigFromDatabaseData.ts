import type { Config, GrantStatus } from "@spurro/shared"
import type { accessGrant } from "@/core/database/schema.js"
import type { InferSelectModel } from "drizzle-orm"

type AccessGrantRow = InferSelectModel<typeof accessGrant>

function assertGrantStatus(v: string): GrantStatus {
  if (v === "active" || v === "revoked" || v === "deleted") return v
  throw new Error(`Unexpected grant status: ${v}`)
}

export function createConfigFromDatabaseData(row: AccessGrantRow): Config {
  return {
    id: row.id,
    endpointId: row.endpointId,
    deviceTypeId: row.deviceTypeId,
    label: row.label,
    config: row.config,
    status: assertGrantStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
