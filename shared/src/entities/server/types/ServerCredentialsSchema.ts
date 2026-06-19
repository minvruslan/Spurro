import { z } from "zod"

export const ServerCredentialsSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
})
