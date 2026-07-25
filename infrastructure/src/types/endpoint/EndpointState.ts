import type { z } from "zod"
import type { EndpointStateSchema } from "./EndpointStateSchema"

export type EndpointState = z.infer<typeof EndpointStateSchema>
