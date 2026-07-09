import type { z } from "zod"
import type { ServerContractSchema } from "./ServerContractSchema"

export type ServerContract = z.infer<typeof ServerContractSchema>
