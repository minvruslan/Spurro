import type { z } from "zod"
import type { UpsertServerEndpointSchema } from "./UpsertServerEndpointSchema"

export type UpsertServerEndpoint = z.infer<typeof UpsertServerEndpointSchema>
