import { isNull, ne, or } from "drizzle-orm"
import { user } from "@/core/database/schemas/authSchema.js"

export const notAdmin = () => or(isNull(user.role), ne(user.role, "admin"))
