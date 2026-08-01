import { z } from "zod"

export const EndpointStatusSchema = z.enum(["active", "deleted"])
