import { z } from "zod"

export const ServerStatusSchema = z.enum(["provisioning", "active"])
