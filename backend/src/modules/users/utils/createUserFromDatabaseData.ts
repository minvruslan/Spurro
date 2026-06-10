import type { User } from "@spurro/shared"
import type { findUsers } from "../repository/findUsers.js"

type UserRow = Awaited<ReturnType<typeof findUsers>>[number]

export function createUserFromDatabaseData(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    banned: row.banned,
    banReason: row.banReason,
    createdAt: row.createdAt.toISOString(),
  }
}
