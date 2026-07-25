import { user } from "../schemas/authSchema.js"

export const userSelection = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  banned: user.banned,
  banReason: user.banReason,
  createdAt: user.createdAt,
}
