import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getConfigsRoute } from "./routes/getConfigsRoute.js"
import { createConfigRoute } from "./routes/createConfigRoute.js"

const configsRouter = new Hono<{ Variables: AppVariables }>()

configsRouter.route("/", getConfigsRoute)
configsRouter.route("/", createConfigRoute)

export { configsRouter }
