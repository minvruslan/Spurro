import { randomUUID } from "node:crypto"
import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { config } from "@/core/database/schemas/index.js"

export async function insertTestConfig(
  overrides: Partial<typeof config.$inferInsert> &
    Pick<typeof config.$inferInsert, "userId" | "endpointId" | "deviceTypeId">,
  executor: DbOrTx = db,
) {
  const [insertedConfig] = await executor
    .insert(config)
    .values({
      name: `Test Config ${randomUUID()}`,
      data: { protocolCode: "amneziawg2", ip: "10.8.0.2" },
      status: "active",
      ...overrides,
    })
    .returning()
  return insertedConfig
}
