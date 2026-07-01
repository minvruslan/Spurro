import { Hono } from "hono"
import { logger } from "hono/logger"
import type { AppVariables } from "@/core/types/index.js"
import { authServer } from "@/core/auth-server/index.js"
import { requireAuth, requireAdmin } from "@/core/middlewares/index.js"
import { configRouter } from "@/api/modules/config/index.js"
import { configLimitRouter } from "@/api/modules/config-limit/index.js"
import { userRouter } from "@/api/modules/user/index.js"
import { serverRouter } from "@/api/modules/server/index.js"
import { protocolRouter } from "@/api/modules/protocol/index.js"
import { protocolTypeRouter } from "@/api/modules/protocol-type/index.js"
import { endpointRouter } from "@/api/modules/endpoint/index.js"
import { deviceTypeRouter } from "@/api/modules/device-type/index.js"

const app = new Hono<{ Variables: AppVariables }>()

app.use("*", logger())

app.get("/health", (c) => c.json({ status: "ok" }))

const api = new Hono<{ Variables: AppVariables }>()

api.on(["POST", "GET"], "/auth/*", (c) => authServer.handler(c.req.raw))

const configApi = new Hono<{ Variables: AppVariables }>()
configApi.use("*", requireAuth)
configApi.route("/", configRouter)
api.route("/configs", configApi)

const configLimitApi = new Hono<{ Variables: AppVariables }>()
configLimitApi.use("*", requireAuth)
configLimitApi.route("/", configLimitRouter)
api.route("/config-limits", configLimitApi)

const userApi = new Hono<{ Variables: AppVariables }>()
userApi.use("*", requireAdmin)
userApi.route("/", userRouter)
api.route("/users", userApi)

const serverApi = new Hono<{ Variables: AppVariables }>()
serverApi.use("*", requireAdmin)
serverApi.route("/", serverRouter)
api.route("/servers", serverApi)

const protocolApi = new Hono<{ Variables: AppVariables }>()
protocolApi.use("*", requireAdmin)
protocolApi.route("/", protocolRouter)
api.route("/protocols", protocolApi)

const protocolTypeApi = new Hono<{ Variables: AppVariables }>()
protocolTypeApi.use("*", requireAdmin)
protocolTypeApi.route("/", protocolTypeRouter)
api.route("/protocol-types", protocolTypeApi)

const endpointApi = new Hono<{ Variables: AppVariables }>()
endpointApi.use("*", requireAuth)
endpointApi.route("/", endpointRouter)
api.route("/endpoints", endpointApi)

const deviceTypeApi = new Hono<{ Variables: AppVariables }>()
deviceTypeApi.use("*", requireAuth)
deviceTypeApi.route("/", deviceTypeRouter)
api.route("/device-types", deviceTypeApi)

app.route("/api", api)

export default app
