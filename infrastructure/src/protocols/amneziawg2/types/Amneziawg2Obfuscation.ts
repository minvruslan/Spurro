import type { z } from "zod"
import type { Amneziawg2ObfuscationSchema } from "./Amneziawg2ObfuscationSchema.js"

export type Amneziawg2Obfuscation = z.infer<typeof Amneziawg2ObfuscationSchema>
