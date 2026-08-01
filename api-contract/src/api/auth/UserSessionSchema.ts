import { z } from "zod"

// Authenticated user exposed to the app: a subset of the auth `user` table columns.
export const UserSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
})
