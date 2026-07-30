import { z } from "zod"
import { IpSchema } from "../common/network/IpSchema"
import { UnixPathSchema } from "../common/unix/UnixPathSchema"
import { ServerSshSchema } from "./ServerSshSchema"

export const ServerDesiredStateSchema = z.object({
  ssh: ServerSshSchema,
  dns: z
    .string()
    .min(1)
    .refine(
      (value) => value.split(",").every((entry) => IpSchema.safeParse(entry.trim()).success),
      {
        message: "DNS must be a comma-separated list of IP addresses",
      },
    ),
  baseDirectory: UnixPathSchema,
})
