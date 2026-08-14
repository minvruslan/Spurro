import { z } from "zod"
import { IpSchema } from "../../../common/network/IpSchema"
import { ProtocolCodeSchema } from "../../../protocols/ProtocolCodeSchema"
import { Amneziawg2ConfigOptionsSchema } from "./Amneziawg2ConfigOptionsSchema"

export const Amneziawg2ConfigDataSchema = z.object({
  protocolCode: z.literal(ProtocolCodeSchema.enum.amneziawg2),
  clientIp: IpSchema,
  publicKey: z.string().optional(),
  presharedKey: z.string().optional(),
  options: Amneziawg2ConfigOptionsSchema.omit({ protocolCode: true }),
})
