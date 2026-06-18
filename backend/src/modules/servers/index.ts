import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getServersRoute } from "./routes/getServersRoute.js"
import { getServerRoute } from "./routes/getServerRoute.js"
import { createServerRoute } from "./routes/createServerRoute.js"

const serversRouter = new Hono<{ Variables: AppVariables }>()

serversRouter.route("/", getServersRoute)
serversRouter.route("/", getServerRoute)
serversRouter.route("/", createServerRoute)

export { serversRouter }
