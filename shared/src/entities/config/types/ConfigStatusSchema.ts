import { z } from "zod"

export const ConfigStatusSchema = z.enum(["active", "deleted"])
