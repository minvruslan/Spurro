import { z } from "zod"
import { IpSchema } from "../../network/IpSchema"
import { SupportedProtocolCodeSchema } from "./SupportedProtocolCodeSchema"

export const Amneziawg2ConfigDataSchema = z.object({
  protocolCode: z.literal(SupportedProtocolCodeSchema.enum.amneziawg2),
  ip: IpSchema,
  publicKey: z.string().optional(),
  presharedKey: z.string().optional(),
  configuration: z.string().optional(),
})
