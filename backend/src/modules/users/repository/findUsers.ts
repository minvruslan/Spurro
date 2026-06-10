import { desc } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { user } from "@/core/database/auth-schema.js"

export async function findUsers() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
}
