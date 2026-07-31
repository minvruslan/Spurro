import { bootstrapLogger } from "@/core/logger/index.js"
import { ProtocolRegistry } from "@spurro/infrastructure/types"
import { db } from "@/core/database/index.js"
import { protocol } from "@/core/database/schemas/domainSchema.js"

const PROTOCOL_ROWS = Object.entries(ProtocolRegistry).map(([code, { family, name }]) => ({
  code,
  family,
  name,
}))

export async function bootstrapProtocols() {
  const inserted = await db
    .insert(protocol)
    .values(PROTOCOL_ROWS)
    .onConflictDoNothing({ target: protocol.code })
    .returning({ code: protocol.code })

  if (inserted.length > 0) {
    bootstrapLogger.info(`Seeded protocols: ${inserted.map((r) => r.code).join(", ")}.`)
  }
}
