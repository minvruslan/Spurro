import { AMNEZIAWG_PROTOCOL_CODE } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { protocol, protocolType } from "@/core/database/schemas/domainSchema.js"

const PROTOCOL_TYPES = [{ code: AMNEZIAWG_PROTOCOL_CODE, name: "AmneziaWG" }]

const PROTOCOL_VERSIONS = [{ typeCode: AMNEZIAWG_PROTOCOL_CODE, version: "2.0" }]

export async function bootstrapProtocols() {
  const insertedTypes = await db
    .insert(protocolType)
    .values(PROTOCOL_TYPES)
    .onConflictDoNothing({ target: protocolType.code })
    .returning({ code: protocolType.code })

  if (insertedTypes.length > 0) {
    console.log(`[bootstrap] seeded protocol types: ${insertedTypes.map((r) => r.code).join(", ")}`)
  }

  const types = await db.select({ id: protocolType.id, code: protocolType.code }).from(protocolType)

  const idByCode = new Map(types.map((t) => [t.code, t.id]))

  const values = []
  for (const { typeCode, version } of PROTOCOL_VERSIONS) {
    const protocolTypeId = idByCode.get(typeCode)
    if (!protocolTypeId) {
      console.warn(
        `[bootstrap] protocol type "${typeCode}" not found — skipping version ${version}`,
      )
      continue
    }
    values.push({ protocolTypeId, version })
  }

  if (values.length === 0) return

  const insertedVersions = await db
    .insert(protocol)
    .values(values)
    .onConflictDoNothing({ target: [protocol.protocolTypeId, protocol.version] })
    .returning({ protocolTypeId: protocol.protocolTypeId, version: protocol.version })

  if (insertedVersions.length > 0) {
    const codeById = new Map(types.map((t) => [t.id, t.code]))
    const labels = insertedVersions.map(
      (r) => `${codeById.get(r.protocolTypeId) ?? r.protocolTypeId} ${r.version}`,
    )
    console.log(`[bootstrap] seeded protocols: ${labels.join(", ")}`)
  }
}
