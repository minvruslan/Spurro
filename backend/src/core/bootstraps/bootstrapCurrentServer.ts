import { eq } from "drizzle-orm"
import { CountryCodeSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schema.js"

export async function bootstrapCurrentServer() {
  const domainName = process.env.DOMAIN_NAME
  const ip = process.env.IP
  const country = CountryCodeSchema.safeParse(process.env.COUNTRY?.toUpperCase())

  if (!domainName || !ip || !country.success) {
    console.warn(
      "[bootstrap] DOMAIN_NAME, IP or valid COUNTRY (ISO 3166-1 alpha-2, e.g. NL) not set — skipping current server bootstrap",
    )
    return
  }

  const existing = await db.select().from(server).where(eq(server.isCurrent, true)).limit(1)
  if (existing.length > 0) return

  await db.insert(server).values({
    name: "Current",
    domainName,
    ip,
    country: country.data,
    status: "active",
    isCurrent: true,
  })

  console.log(`[bootstrap] created current (local) server: ${domainName}`)
}
