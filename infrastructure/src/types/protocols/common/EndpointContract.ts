import type { z } from "zod"
import type { EndpointContractSchema } from "./EndpointContractSchema"

export type EndpointContract = z.infer<typeof EndpointContractSchema>
