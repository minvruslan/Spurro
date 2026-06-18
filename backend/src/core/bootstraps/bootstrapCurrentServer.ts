import { eq } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schema.js"

export async function bootstrapCurrentServer() {
  const domainName = process.env.DOMAIN_NAME
  const ip = process.env.IP
  if (!domainName || !ip) {
    console.warn("[bootstrap] DOMAIN_NAME or IP not set — skipping current server bootstrap")
    return
  }

  const existing = await db.select().from(server).where(eq(server.isCurrent, true)).limit(1)
  if (existing.length > 0) return

  await db.insert(server).values({
    name: "Current",
    domainName,
    ip,
    country: process.env.COUNTRY ?? "Unknown",
    status: "active",
    isCurrent: true,
  })

  console.log(`[bootstrap] created current (local) server: ${domainName}`)
}
