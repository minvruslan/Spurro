import { eq } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { endpoint } from "@/core/database/schemas/domainSchema.js"

export async function updateEndpointData(
  endpointId: string,
  data: typeof endpoint.$inferSelect.data,
) {
  return db.update(endpoint).set({ data }).where(eq(endpoint.id, endpointId))
}
