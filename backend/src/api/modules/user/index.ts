import { getUsersRoute } from "./routes/getUsersRoute.js"
import { getUserRoute } from "./routes/getUserRoute.js"
import { createUserRoute } from "./routes/createUserRoute.js"
import { updateUserRoute } from "./routes/updateUserRoute.js"
import { deleteUserRoute } from "./routes/deleteUserRoute.js"

const userRouter = {
  getUsers: getUsersRoute,
  getUser: getUserRoute,
  createUser: createUserRoute,
  updateUser: updateUserRoute,
  deleteUser: deleteUserRoute,
}

export { userRouter }
