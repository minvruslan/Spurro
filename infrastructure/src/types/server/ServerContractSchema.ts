import { z } from "zod"
import { DomainNameSchema, IPSchema, PortSchema, UnixPathSchema, UnixUsernameSchema } from "@spurro/shared"

export const ServerContractSchema = z.object({
  domain: DomainNameSchema.nullable(),
  ip: IPSchema,
  sshPort: PortSchema,
  dns: z
    .string()
    .min(1)
    .refine(
      (value) => value.split(",").every((entry) => IPSchema.safeParse(entry.trim()).success),
      {
        message: "DNS must be a comma-separated list of IP addresses",
      },
    ),
  service: z.object({
    username: UnixUsernameSchema,
    baseDirectory: UnixPathSchema,
  }),
})
