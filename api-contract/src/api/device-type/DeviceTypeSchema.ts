import { z } from "zod"

export const DeviceTypeSchema = z.object({
  id: z.uuid(),
  code: z.enum(["ios", "ipados", "macos", "windows", "android"]),
  name: z.enum(["iOS", "iPadOS", "macOS", "Windows", "Android"]),
})
