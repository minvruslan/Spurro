import type { z } from "zod"
import type { ServerCredentialsSchema } from "./ServerCredentialsSchema"

export type ServerCredentials = z.infer<typeof ServerCredentialsSchema>
