import { z } from "zod"

export const GrantStatusSchema = z.enum(["active", "revoked", "deleted"])
