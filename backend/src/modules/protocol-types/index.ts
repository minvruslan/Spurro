import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getProtocolTypesRoute } from "./routes/getProtocolTypesRoute.js"

const protocolTypesRouter = new Hono<{ Variables: AppVariables }>()

protocolTypesRouter.route("/", getProtocolTypesRoute)

export { protocolTypesRouter }
