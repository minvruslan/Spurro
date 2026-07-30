import { z } from "zod"

export const IpSchema = z.union([z.ipv4(), z.ipv6()])
