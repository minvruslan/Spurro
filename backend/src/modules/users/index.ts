import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUsersRoute } from "./routes/getUsersRoute.js"
import { getUserRoute } from "./routes/getUserRoute.js"
import { createUserRoute } from "./routes/createUserRoute.js"
import { updateUserRoute } from "./routes/updateUserRoute.js"
import { deleteUserRoute } from "./routes/deleteUserRoute.js"

const usersRouter = new Hono<{ Variables: AppVariables }>()

usersRouter.route("/", getUsersRoute)
usersRouter.route("/", getUserRoute)
usersRouter.route("/", createUserRoute)
usersRouter.route("/", updateUserRoute)
usersRouter.route("/", deleteUserRoute)

export { usersRouter }
