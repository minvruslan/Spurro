import type { Protocol } from "@spurro/shared"
import { ProtocolSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findActiveProtocols } from "../queries/findActiveProtocols.js"

export async function getProtocolsService(): Promise<ServiceResult<{ protocols: Protocol[] }>> {
  const rows = await findActiveProtocols(db)
  return { ok: true, data: { protocols: ProtocolSchema.array().parse(rows) } }
}
