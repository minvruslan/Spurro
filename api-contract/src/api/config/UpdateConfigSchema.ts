import { z } from "zod"

export const UpdateConfigSchema = z.object({
  name: z.string().min(1).max(255),
  deviceTypeId: z.uuid(),
})
