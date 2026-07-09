import { z } from "zod"
import { IPSchema } from "../../network/IPSchema"
import { SupportedProtocolCodeSchema } from "./SupportedProtocolCodeSchema"

export const Amneziawg2ConfigDataSchema = z.object({
  protocolCode: z.literal(SupportedProtocolCodeSchema.enum.amneziawg2),
  ip: IPSchema,
  publicKey: z.string().optional(),
  presharedKey: z.string().optional(),
  configuration: z.string().optional(),
})
