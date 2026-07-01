import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUserConfigLimitsRoute } from "./routes/getUserConfigLimitsRoute.js"

const configLimitRouter = new Hono<{ Variables: AppVariables }>()

configLimitRouter.route("/", getUserConfigLimitsRoute)

export { configLimitRouter }
