import { and, eq, ne } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { accessGrant } from "@/core/database/schema.js"

export async function updateConfig(
  executor: DbOrTx,
  userId: string,
  id: string,
  fields: { name: string; deviceTypeId: string },
) {
  return executor
    .update(accessGrant)
    .set({ name: fields.name, deviceTypeId: fields.deviceTypeId })
    .where(
      and(
        eq(accessGrant.id, id),
        eq(accessGrant.userId, userId),
        ne(accessGrant.status, "deleted"),
      ),
    )
    .returning({ id: accessGrant.id })
}
