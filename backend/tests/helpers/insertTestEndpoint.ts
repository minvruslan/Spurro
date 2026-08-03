import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { endpoint } from "@/core/database/schemas/index.js"

export async function insertTestEndpoint(
  overrides: Partial<typeof endpoint.$inferInsert> &
    Pick<typeof endpoint.$inferInsert, "serverId" | "protocolId">,
  executor: DbOrTx = db,
) {
  const [insertedEndpoint] = await executor
    .insert(endpoint)
    .values({
      port: 51820,
      data: {
        actualState: {
          protocolCode: "amneziawg2",
          port: 51820,
          appliedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      ...overrides,
    })
    .returning()
  return insertedEndpoint
}
