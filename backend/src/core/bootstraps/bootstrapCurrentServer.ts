import { eq } from "drizzle-orm"
import { CountryCodeSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"
import { env } from "@/core/env/index.js"

export async function bootstrapCurrentServer() {
  const domainName = env.DOMAIN_NAME
  const ip = env.IP
  const country = CountryCodeSchema.safeParse(env.COUNTRY?.toUpperCase())

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
