import { z } from "zod"
import { DomainNameSchema } from "../../../core/network/DomainNameSchema"
import { IPSchema } from "../../../core/network/IPSchema"
import { UnixPathSchema } from "../../../core/unix/UnixPathSchema"
import { UnixUsernameSchema } from "../../../core/unix/UnixUsernameSchema"

export const ServerContractSchema = z.object({
  domain: DomainNameSchema.nullable(),
  ip: IPSchema,
  dns: z
    .string()
    .min(1)
    .refine(
      (value) => value.split(",").every((entry) => IPSchema.safeParse(entry.trim()).success),
      {
        message: "dns must be a comma-separated list of IP addresses",
      },
    ),
  service: z.object({
    username: UnixUsernameSchema,
    baseDirectory: UnixPathSchema,
  }),
})
