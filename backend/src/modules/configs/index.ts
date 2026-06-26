import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getConfigsRoute } from "./routes/getConfigsRoute.js"
import { getConfigRoute } from "./routes/getConfigRoute.js"
import { createConfigRoute } from "./routes/createConfigRoute.js"
import { updateConfigRoute } from "./routes/updateConfigRoute.js"
import { deleteConfigRoute } from "./routes/deleteConfigRoute.js"

const configsRouter = new Hono<{ Variables: AppVariables }>()

configsRouter.route("/", getConfigsRoute)
configsRouter.route("/", getConfigRoute)
configsRouter.route("/", createConfigRoute)
configsRouter.route("/", updateConfigRoute)
configsRouter.route("/", deleteConfigRoute)

export { configsRouter }
