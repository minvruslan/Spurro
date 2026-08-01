import { createMiddleware } from "hono/factory"
import { apiLogger } from "./logger.js"

export const requestLogger = createMiddleware(async (c, next) => {
  const startedAt = Date.now()
  await next()
  apiLogger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMilliseconds: Date.now() - startedAt,
    },
    `${c.req.method} ${c.req.path} ${c.res.status}`,
  )
})
