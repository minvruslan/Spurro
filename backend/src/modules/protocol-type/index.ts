import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getProtocolTypesRoute } from "./routes/getProtocolTypesRoute.js"

const protocolTypeRouter = new Hono<{ Variables: AppVariables }>()

protocolTypeRouter.route("/", getProtocolTypesRoute)

export { protocolTypeRouter }
