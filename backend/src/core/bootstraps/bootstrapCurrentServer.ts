import { eq } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"
import { env } from "@/core/env/index.js"

export async function bootstrapCurrentServer() {
  const existing = await db.select().from(server).where(eq(server.isCurrent, true)).limit(1)
  if (existing.length > 0) return

  await db.insert(server).values({
    name: "Current",
    domainName: env.DOMAIN_NAME ?? null,
    ip: env.IP,
    country: env.COUNTRY,
    status: "active",
    isCurrent: true,
  })

  console.log(`[bootstrap] created current (local) server: ${env.DOMAIN_NAME ?? env.IP}`)
}
