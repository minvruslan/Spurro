import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getProtocolsRoute } from "./routes/getProtocolsRoute.js"

const protocolRouter = new Hono<{ Variables: AppVariables }>()

protocolRouter.route("/", getProtocolsRoute)

export { protocolRouter }
