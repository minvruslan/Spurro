import type { z } from "zod"
import type { EndpointStatusSchema } from "./EndpointStatusSchema"

export type EndpointStatus = z.infer<typeof EndpointStatusSchema>
