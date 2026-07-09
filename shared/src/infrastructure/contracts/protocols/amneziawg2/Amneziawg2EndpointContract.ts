import type { z } from "zod"
import type { Amneziawg2EndpointContractSchema } from "./Amneziawg2EndpointContractSchema"

export type Amneziawg2EndpointContract = z.infer<typeof Amneziawg2EndpointContractSchema>
