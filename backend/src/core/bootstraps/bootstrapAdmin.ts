import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db } from "@/core/database/index.js"
import { user } from "@/core/database/auth-schema.js"

export async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL
  if (!email) {
    console.warn("[bootstrap] ADMIN_EMAIL not set — skipping admin bootstrap")
    return
  }

  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1)
  if (existing.length > 0) return

  await db.insert(user).values({
    id: nanoid(),
    name: process.env.ADMIN_NAME ?? "Admin",
    email,
    emailVerified: true,
    role: "admin",
  })

  console.log(`[bootstrap] created admin user: ${email}`)
}
