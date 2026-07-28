import { z } from "zod"
import { IPSchema, UnixPathSchema } from "@spurro/shared"
import { ServerSSHSchema } from "./ServerSSHSchema"

export const ServerDesiredStateSchema = z.object({
  ssh: ServerSSHSchema,
  dns: z
    .string()
    .min(1)
    .refine(
      (value) => value.split(",").every((entry) => IPSchema.safeParse(entry.trim()).success),
      {
        message: "DNS must be a comma-separated list of IP addresses",
      },
    ),
  baseDirectory: UnixPathSchema,
})
