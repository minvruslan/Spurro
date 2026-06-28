import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/authSchema.js"
import { env } from "@/core/env/index.js"

export async function bootstrapAdmin() {
  const email = env.ADMIN_EMAIL
  if (!email) {
    console.warn("[bootstrap] ADMIN_EMAIL not set — skipping admin bootstrap")
    return
  }

  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1)
  if (existing.length > 0) return

  await db.insert(user).values({
    id: nanoid(),
    name: env.ADMIN_NAME,
    email,
    emailVerified: true,
    role: "admin",
  })

  console.log(`[bootstrap] created admin user: ${email}`)
}
