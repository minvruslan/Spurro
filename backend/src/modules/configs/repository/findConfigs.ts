import { eq, and, ne, desc } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { accessGrant } from "@/core/database/schema.js"

export async function findConfigs(userId: string) {
  return db
    .select()
    .from(accessGrant)
    .where(and(eq(accessGrant.userId, userId), ne(accessGrant.status, "deleted")))
    .orderBy(desc(accessGrant.createdAt))
}
