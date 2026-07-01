import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUsersRoute } from "./routes/getUsersRoute.js"
import { getUserRoute } from "./routes/getUserRoute.js"
import { createUserRoute } from "./routes/createUserRoute.js"
import { updateUserRoute } from "./routes/updateUserRoute.js"
import { deleteUserRoute } from "./routes/deleteUserRoute.js"

const userRouter = new Hono<{ Variables: AppVariables }>()

userRouter.route("/", getUsersRoute)
userRouter.route("/", getUserRoute)
userRouter.route("/", createUserRoute)
userRouter.route("/", updateUserRoute)
userRouter.route("/", deleteUserRoute)

export { userRouter }
