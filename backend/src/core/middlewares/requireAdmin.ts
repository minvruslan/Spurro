import { createMiddleware } from "hono/factory"
import type { AppVariables } from "@/core/types/index.js"
import { authServer } from "@/core/auth-server/index.js"

export const requireAdmin = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const session = await authServer.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: "Unauthorized" }, 401)
  if (session.user.role !== "admin") return c.json({ error: "Forbidden" }, 403)
  c.set("userId", session.user.id)
  await next()
})
