import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getConfigLimitsRoute } from "./routes/getConfigLimitsRoute.js"

const configLimitRouter = new Hono<{ Variables: AppVariables }>()

configLimitRouter.route("/", getConfigLimitsRoute)

export { configLimitRouter }
