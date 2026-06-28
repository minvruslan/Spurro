import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getDeviceTypesRoute } from "./routes/getDeviceTypesRoute.js"

const deviceTypeRouter = new Hono<{ Variables: AppVariables }>()

deviceTypeRouter.route("/", getDeviceTypesRoute)

export { deviceTypeRouter }
