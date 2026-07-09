import { SUPPORTED_PROTOCOLS } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { protocol } from "@/core/database/schemas/domainSchema.js"

const PROTOCOL_ROWS = Object.entries(SUPPORTED_PROTOCOLS).map(([code, { family, name }]) => ({
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
    console.log(`[bootstrap] seeded protocols: ${inserted.map((r) => r.code).join(", ")}`)
  }
}
