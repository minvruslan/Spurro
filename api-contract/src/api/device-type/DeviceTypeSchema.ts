import { z } from "zod"

export const DeviceTypeSchema = z.object({
  id: z.uuid(),
  code: z.enum(["ios", "macos", "windows", "linux", "android"]),
  name: z.enum(["iOS", "macOS", "Windows", "Linux", "Android"]),
})
