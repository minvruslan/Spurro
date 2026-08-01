import { Hono } from "hono"
import { ORPCError, onError } from "@orpc/server"
import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { apiLogger } from "@/core/logger/index.js"
import { authServer } from "@/core/auth-server/index.js"
import { requestLogger } from "@/core/logger/index.js"
import { router } from "@/api/router.js"

const app = new Hono()

app.use("*", requestLogger)

app.onError((error, c) => {
  apiLogger.error({ error, method: c.req.method, path: c.req.path }, "Unhandled error.")
  return c.json({ error: "Internal server error" }, 500)
})

app.get("/health", (c) => c.json({ status: "ok" }))

app.on(["POST", "GET"], "/api/auth/*", (c) => authServer.handler(c.req.raw))

const apiHandler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      const cause = error instanceof Error ? error.cause : undefined
      if (error instanceof ORPCError && error.status < 500) {
        apiLogger.warn({ error, cause }, "Request failed.")
      } else {
        apiLogger.error({ error, cause }, "Request failed.")
      }
    }),
  ],
})

app.use("/api/*", async (c, next) => {
  const { matched, response } = await apiHandler.handle(c.req.raw, {
    prefix: "/api",
    context: { headers: c.req.raw.headers },
  })
  if (matched) return c.newResponse(response.body, response)
  await next()
})

export default app
