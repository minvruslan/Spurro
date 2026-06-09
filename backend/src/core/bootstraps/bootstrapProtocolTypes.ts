import { db } from "@/core/database/index.js"
import { protocolType } from "@/core/database/schema.js"

const PROTOCOL_TYPES = [
  { code: "mtproto", name: "MTProto" },
  { code: "amnezia", name: "Amnezia" },
]

export async function bootstrapProtocolTypes() {
  const inserted = await db
    .insert(protocolType)
    .values(PROTOCOL_TYPES)
    .onConflictDoNothing({ target: protocolType.code })
    .returning({ code: protocolType.code })

  if (inserted.length > 0) {
    console.log(`[bootstrap] seeded protocol types: ${inserted.map((r) => r.code).join(", ")}`)
  }
}
