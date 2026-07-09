import { z } from "zod"

export const UpdateConfigSchema = z.object({
  name: z.string().min(1),
  deviceTypeId: z.uuid(),
})
