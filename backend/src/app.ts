import { Hono } from "hono"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import type { AppVariables } from "@/core/types/index.js"
import { authServer } from "@/core/auth-server/index.js"
import { requireAuth } from "@/core/middlewares/index.js"
import { configsRouter } from "@/modules/configs/index.js"

const app = new Hono<{ Variables: AppVariables }>()

app.use("*", logger())
app.use("*", cors())

app.get("/health", (c) => c.json({ status: "ok" }))

const api = new Hono<{ Variables: AppVariables }>()

api.on(["POST", "GET"], "/auth/*", (c) => authServer.handler(c.req.raw))

const protectedApi = new Hono<{ Variables: AppVariables }>()
protectedApi.use("*", requireAuth)
protectedApi.route("/configs", configsRouter)
api.route("/", protectedApi)

app.route("/api", api)

export default app
