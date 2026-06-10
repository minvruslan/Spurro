import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUsersRoute } from "./routes/getUsersRoute.js"

const usersRouter = new Hono<{ Variables: AppVariables }>()

usersRouter.route("/", getUsersRoute)

export { usersRouter }
