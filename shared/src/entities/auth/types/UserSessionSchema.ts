import { z } from "zod"

// The authenticated user as exposed to the app. Mirrors the columns of the
// `user` table (see backend auth-schema), narrowed to what the frontend needs.
export const UserSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
})
