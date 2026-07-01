import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUserConfigsRoute } from "./routes/getUserConfigsRoute.js"
import { getUserConfigRoute } from "./routes/getUserConfigRoute.js"
import { createUserConfigRoute } from "./routes/createUserConfigRoute.js"
import { updateUserConfigRoute } from "./routes/updateUserConfigRoute.js"
import { deleteUserConfigRoute } from "./routes/deleteUserConfigRoute.js"

const configRouter = new Hono<{ Variables: AppVariables }>()

configRouter.route("/", getUserConfigsRoute)
configRouter.route("/", getUserConfigRoute)
configRouter.route("/", createUserConfigRoute)
configRouter.route("/", updateUserConfigRoute)
configRouter.route("/", deleteUserConfigRoute)

export { configRouter }
