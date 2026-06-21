import type { ProtocolType } from "@spurro/shared"
import { ProtocolTypeSchema } from "@spurro/shared"
import { findProtocolTypes } from "../repository/findProtocolTypes.js"

export async function getProtocolTypesService(): Promise<ProtocolType[]> {
  const rows = await findProtocolTypes()
  return ProtocolTypeSchema.array().parse(rows)
}
