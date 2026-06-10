import { z } from "zod"

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  createdAt: z.iso.datetime(),
})
