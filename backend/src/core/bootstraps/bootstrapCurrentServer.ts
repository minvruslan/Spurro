import { bootstrapLogger } from "@/core/logger/index.js"
import { eq } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { server } from "@/core/database/schemas/domainSchema.js"
import { env } from "@/core/env/index.js"

export async function bootstrapCurrentServer() {
  const domainName = env.DOMAIN_NAME ?? null

  const [existingServer] = await db.select().from(server).where(eq(server.isCurrent, true)).limit(1)

  if (existingServer) {
    if (
      existingServer.ip === env.IP &&
      existingServer.country === env.COUNTRY &&
      existingServer.domainName === domainName
    ) {
      return
    }

    await db
      .update(server)
      .set({ ip: env.IP, country: env.COUNTRY, domainName })
      .where(eq(server.id, existingServer.id))

    bootstrapLogger.info(`Updated current (local) server address: ${domainName ?? env.IP}.`)

    return
  }

  await db.insert(server).values({
    name: "Current",
    domainName,
    ip: env.IP,
    country: env.COUNTRY,
    status: "active",
    isCurrent: true,
  })

  bootstrapLogger.info(`Created current (local) server: ${domainName ?? env.IP}.`)
}
