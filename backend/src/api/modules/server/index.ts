import { getServersRoute } from "./routes/getServersRoute.js"
import { getServerRoute } from "./routes/getServerRoute.js"
import { createServerRoute } from "./routes/createServerRoute.js"
import { updateServerRoute } from "./routes/updateServerRoute.js"
import { deleteServerRoute } from "./routes/deleteServerRoute.js"

const serverRouter = {
  getServers: getServersRoute,
  getServer: getServerRoute,
  createServer: createServerRoute,
  updateServer: updateServerRoute,
  deleteServer: deleteServerRoute,
}

export { serverRouter }
