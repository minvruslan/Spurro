import type { z } from "zod"
import type { EndpointServerSchema } from "./EndpointServerSchema"

export type EndpointServer = z.infer<typeof EndpointServerSchema>
