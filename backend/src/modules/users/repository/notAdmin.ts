import { isNull, ne, or } from "drizzle-orm"
import { user } from "@/core/database/auth-schema.js"

export const notAdmin = () => or(isNull(user.role), ne(user.role, "admin"))
