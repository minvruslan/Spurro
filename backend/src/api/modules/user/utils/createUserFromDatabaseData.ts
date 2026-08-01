import type { User } from "@spurro/api-contract"
import type { findUsers } from "../queries/findUsers.js"

type UserRow = Awaited<ReturnType<typeof findUsers>>[number]

export function createUserFromDatabaseData(row: UserRow): Omit<User, "limits"> {
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
