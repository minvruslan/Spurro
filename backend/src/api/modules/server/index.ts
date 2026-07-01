import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getServersRoute } from "./routes/getServersRoute.js"
import { getServerRoute } from "./routes/getServerRoute.js"
import { createServerRoute } from "./routes/createServerRoute.js"
import { updateServerRoute } from "./routes/updateServerRoute.js"
import { deleteServerRoute } from "./routes/deleteServerRoute.js"

const serverRouter = new Hono<{ Variables: AppVariables }>()

serverRouter.route("/", getServersRoute)
serverRouter.route("/", getServerRoute)
serverRouter.route("/", createServerRoute)
serverRouter.route("/", updateServerRoute)
serverRouter.route("/", deleteServerRoute)

export { serverRouter }
