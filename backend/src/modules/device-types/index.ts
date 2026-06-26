import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getDeviceTypesRoute } from "./routes/getDeviceTypesRoute.js"

const deviceTypesRouter = new Hono<{ Variables: AppVariables }>()

deviceTypesRouter.route("/", getDeviceTypesRoute)

export { deviceTypesRouter }
