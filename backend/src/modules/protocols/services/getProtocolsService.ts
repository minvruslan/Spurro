import type { Protocol } from "@spurro/shared"
import { ProtocolSchema } from "@spurro/shared"
import { findProtocols } from "../repository/findProtocols.js"

export async function getProtocolsService(): Promise<Protocol[]> {
  const rows = await findProtocols()
  return ProtocolSchema.array().parse(
    rows.map((row) => ({
      id: row.id,
      version: row.version,
      type: {
        id: row.typeId,
        code: row.typeCode,
        name: row.typeName,
      },
    })),
  )
}
