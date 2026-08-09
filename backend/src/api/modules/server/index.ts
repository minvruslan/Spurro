import { getServersRoute } from "./routes/getServersRoute.js"
import { getServerRoute } from "./routes/getServerRoute.js"
import { createServerRoute } from "./routes/createServerRoute.js"

const serverRouter = {
  getServers: getServersRoute,
  getServer: getServerRoute,
  createServer: createServerRoute,
}

export { serverRouter }
