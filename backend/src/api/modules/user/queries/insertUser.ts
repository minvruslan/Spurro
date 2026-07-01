import { nanoid } from "nanoid"
import type { DbOrTx } from "@/core/database/index.js"
import { user } from "@/core/database/schemas/authSchema.js"

type UserFields = {
  name: string
  email: string
}

export async function insertUser(executor: DbOrTx, fields: UserFields) {
  return executor
    .insert(user)
    .values({
      id: nanoid(),
      name: fields.name,
      email: fields.email,
      emailVerified: true,
    })
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
}
