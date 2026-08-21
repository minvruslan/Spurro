import { randomUUID } from "node:crypto"
import type { DbOrTx } from "@/core/database/index.js"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/index.js"

export async function insertTestServer(
  overrides: Partial<typeof server.$inferInsert> = {},
  executor: DbOrTx = db,
) {
  const [insertedServer] = await executor
    .insert(server)
    .values({
      name: `Test Server ${randomUUID()}`,
      ip: "192.0.2.1",
      country: "NL",
      data: {
        facts: { sshHostKeys: ["ssh-ed25519 AAAATestServerHostKey"] },
        actualState: {
          ssh: { type: "privateKey", username: "vancloak", port: 22 },
          baseDirectory: "/opt/vancloak",
          appliedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      ...overrides,
    })
    .returning()
  return insertedServer
}
