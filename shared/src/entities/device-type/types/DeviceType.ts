import type { z } from "zod"
import type { DeviceTypeSchema } from "./DeviceTypeSchema"

export type DeviceType = z.infer<typeof DeviceTypeSchema>
