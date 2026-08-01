import type { z } from "zod"
import type { EndpointSchema } from "./EndpointSchema"

export type Endpoint = z.infer<typeof EndpointSchema>
