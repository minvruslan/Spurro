import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getConfigLimitsRoute } from "./routes/getConfigLimitsRoute.js"

const configLimitsRouter = new Hono<{ Variables: AppVariables }>()

configLimitsRouter.route("/", getConfigLimitsRoute)

export { configLimitsRouter }
