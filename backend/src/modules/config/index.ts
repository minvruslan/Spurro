import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getConfigsRoute } from "./routes/getConfigsRoute.js"
import { getConfigRoute } from "./routes/getConfigRoute.js"
import { createConfigRoute } from "./routes/createConfigRoute.js"
import { updateConfigRoute } from "./routes/updateConfigRoute.js"
import { deleteConfigRoute } from "./routes/deleteConfigRoute.js"

const configRouter = new Hono<{ Variables: AppVariables }>()

configRouter.route("/", getConfigsRoute)
configRouter.route("/", getConfigRoute)
configRouter.route("/", createConfigRoute)
configRouter.route("/", updateConfigRoute)
configRouter.route("/", deleteConfigRoute)

export { configRouter }
