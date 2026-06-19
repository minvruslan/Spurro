import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getProtocolsRoute } from "./routes/getProtocolsRoute.js"

const protocolsRouter = new Hono<{ Variables: AppVariables }>()

protocolsRouter.route("/", getProtocolsRoute)

export { protocolsRouter }
