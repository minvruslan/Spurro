import type { z } from "zod"
import type { ServerEndpointSchema } from "./ServerEndpointSchema"

export type ServerEndpoint = z.infer<typeof ServerEndpointSchema>
