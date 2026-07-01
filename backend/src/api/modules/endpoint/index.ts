import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getEndpointsRoute } from "./routes/getEndpointsRoute.js"

const endpointRouter = new Hono<{ Variables: AppVariables }>()

endpointRouter.route("/", getEndpointsRoute)

export { endpointRouter }
