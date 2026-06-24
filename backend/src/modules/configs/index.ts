import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getConfigsRoute } from "./routes/getConfigsRoute.js"

const configsRouter = new Hono<{ Variables: AppVariables }>()

configsRouter.route("/", getConfigsRoute)

export { configsRouter }
