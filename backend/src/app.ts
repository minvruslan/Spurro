import { Hono } from "hono"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import type { AppVariables } from "@/core/types/index.js"
import { authServer } from "@/core/auth-server/index.js"
import { requireAuth, requireAdmin } from "@/core/middlewares/index.js"
import { configsRouter } from "@/modules/configs/index.js"
import { usersRouter } from "@/modules/users/index.js"

const app = new Hono<{ Variables: AppVariables }>()

app.use("*", logger())
app.use("*", cors())

app.get("/health", (c) => c.json({ status: "ok" }))

const api = new Hono<{ Variables: AppVariables }>()

api.on(["POST", "GET"], "/auth/*", (c) => authServer.handler(c.req.raw))

// Each feature router is wrapped in its own guarded sub-app mounted at an explicit
// prefix, so the guard's "*" matches only that prefix — no overlap between guards,
// independent of registration order or handler terminality.
const configsApi = new Hono<{ Variables: AppVariables }>()
configsApi.use("*", requireAuth)
configsApi.route("/", configsRouter)
api.route("/configs", configsApi)

const usersApi = new Hono<{ Variables: AppVariables }>()
usersApi.use("*", requireAdmin)
usersApi.route("/", usersRouter)
api.route("/users", usersApi)

app.route("/api", api)

export default app
