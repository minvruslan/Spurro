import { z } from "zod"

export const IPSchema = z.union([z.ipv4(), z.ipv6()])
