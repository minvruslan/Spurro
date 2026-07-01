import type { ProtocolType } from "@spurro/shared"
import { ProtocolTypeSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findProtocolTypes } from "../queries/findProtocolTypes.js"

export async function getProtocolTypesService(): Promise<ProtocolType[]> {
  const rows = await findProtocolTypes(db)
  return ProtocolTypeSchema.array().parse(rows)
}
