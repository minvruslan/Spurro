import { bootstrapLogger } from "@/core/logger/index.js"
import { eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/authSchema.js"
import { env } from "@/core/env/index.js"

export async function bootstrapAdmin() {
  const email = env.ADMIN_EMAIL.toLowerCase()

  const existingAdmin = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "admin"))
    .limit(1)
  if (existingAdmin.length > 0) return

  const existing = await db
    .select()
    .from(user)
    .where(eq(sql`lower(${user.email})`, email))
    .limit(1)
  if (existing.length > 0) return

  await db.insert(user).values({
    id: nanoid(),
    name: env.ADMIN_NAME,
    email,
    emailVerified: true,
    role: "admin",
  })

  bootstrapLogger.info(`Created admin user: ${email}.`)
}
