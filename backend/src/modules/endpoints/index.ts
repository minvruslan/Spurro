import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getEndpointsRoute } from "./routes/getEndpointsRoute.js"

const endpointsRouter = new Hono<{ Variables: AppVariables }>()

endpointsRouter.route("/", getEndpointsRoute)

export { endpointsRouter }
