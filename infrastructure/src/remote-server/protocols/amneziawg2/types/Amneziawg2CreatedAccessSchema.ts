import { z } from "zod"
import { Amneziawg2KeySchema } from "@spurro/shared/infrastructure"
import { Amneziawg2ObfuscationSchema } from "./Amneziawg2ObfuscationSchema.js"

export const Amneziawg2CreatedAccessSchema = z.object({
  clientPrivateKey: Amneziawg2KeySchema,
  clientPublicKey: Amneziawg2KeySchema,
  serverPublicKey: Amneziawg2KeySchema,
  presharedKey: Amneziawg2KeySchema,
  obfuscation: Amneziawg2ObfuscationSchema,
})
