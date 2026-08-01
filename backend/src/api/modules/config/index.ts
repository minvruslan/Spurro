import { getUserConfigsRoute } from "./routes/getUserConfigsRoute.js"
import { getUserConfigRoute } from "./routes/getUserConfigRoute.js"
import { createUserConfigRoute } from "./routes/createUserConfigRoute.js"
import { updateUserConfigRoute } from "./routes/updateUserConfigRoute.js"
import { deleteUserConfigRoute } from "./routes/deleteUserConfigRoute.js"

const configRouter = {
  getUserConfigs: getUserConfigsRoute,
  getUserConfig: getUserConfigRoute,
  createUserConfig: createUserConfigRoute,
  updateUserConfig: updateUserConfigRoute,
  deleteUserConfig: deleteUserConfigRoute,
}

export { configRouter }
export { deleteUserConfigsService } from "./services/deleteUserConfigsService.js"
