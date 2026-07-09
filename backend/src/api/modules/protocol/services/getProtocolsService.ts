import type { Protocol } from "@spurro/shared"
import { ProtocolSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findProtocols } from "../queries/findProtocols.js"

export async function getProtocolsService(): Promise<Protocol[]> {
  const rows = await findProtocols(db)
  return ProtocolSchema.array().parse(rows)
}
