import { z } from "zod"
import { IpSchema } from "../../common/network/IpSchema"
import { ProtocolCodeSchema } from "../ProtocolCodeSchema"

export const Amneziawg2ConfigDataSchema = z.object({
  protocolCode: z.literal(ProtocolCodeSchema.enum.amneziawg2),
  ip: IpSchema,
  publicKey: z.string().optional(),
  presharedKey: z.string().optional(),
  configuration: z.string().optional(),
})
