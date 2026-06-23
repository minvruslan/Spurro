import { Hono } from "hono"
import { logger } from "hono/logger"
import type { AppVariables } from "@/core/types/index.js"
import { authServer } from "@/core/auth-server/index.js"
import { requireAuth, requireAdmin } from "@/core/middlewares/index.js"
import { configsRouter } from "@/modules/configs/index.js"
import { usersRouter } from "@/modules/users/index.js"
import { serversRouter } from "@/modules/servers/index.js"
import { protocolsRouter } from "@/modules/protocols/index.js"
import { protocolTypesRouter } from "@/modules/protocol-types/index.js"
import { endpointsRouter } from "@/modules/endpoints/index.js"

const app = new Hono<{ Variables: AppVariables }>()

app.use("*", logger())

app.get("/health", (c) => c.json({ status: "ok" }))

const api = new Hono<{ Variables: AppVariables }>()

api.on(["POST", "GET"], "/auth/*", (c) => authServer.handler(c.req.raw))

const configsApi = new Hono<{ Variables: AppVariables }>()
configsApi.use("*", requireAuth)
configsApi.route("/", configsRouter)
api.route("/configs", configsApi)

const usersApi = new Hono<{ Variables: AppVariables }>()
usersApi.use("*", requireAdmin)
usersApi.route("/", usersRouter)
api.route("/users", usersApi)

const serversApi = new Hono<{ Variables: AppVariables }>()
serversApi.use("*", requireAdmin)
serversApi.route("/", serversRouter)
api.route("/servers", serversApi)

const protocolsApi = new Hono<{ Variables: AppVariables }>()
protocolsApi.use("*", requireAdmin)
protocolsApi.route("/", protocolsRouter)
api.route("/protocols", protocolsApi)

const protocolTypesApi = new Hono<{ Variables: AppVariables }>()
protocolTypesApi.use("*", requireAdmin)
protocolTypesApi.route("/", protocolTypesRouter)
api.route("/protocol-types", protocolTypesApi)

const endpointsApi = new Hono<{ Variables: AppVariables }>()
endpointsApi.use("*", requireAuth)
endpointsApi.route("/", endpointsRouter)
api.route("/endpoints", endpointsApi)

app.route("/api", api)

export default app
