import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUserConfigLimitsRoute } from "./routes/getUserConfigLimitsRoute.js"

const configLimitRouter = new Hono<{ Variables: AppVariables }>()

configLimitRouter.route("/", getUserConfigLimitsRoute)

export { configLimitRouter }
export { getUserConfigLimitsService } from "./services/getUserConfigLimitsService.js"
export { getUsersConfigLimitsService } from "./services/getUsersConfigLimitsService.js"
export { setUserConfigLimitsService } from "./services/setUserConfigLimitsService.js"
export { isUserConfigLimitReachedService } from "./services/isUserConfigLimitReachedService.js"
