import { z } from "zod"

const ObfuscationValueSchema = z.string().min(1)

export const Amneziawg2ObfuscationSchema = z.object({
  Jc: ObfuscationValueSchema,
  Jmin: ObfuscationValueSchema,
  Jmax: ObfuscationValueSchema,
  S1: ObfuscationValueSchema,
  S2: ObfuscationValueSchema,
  S3: ObfuscationValueSchema,
  S4: ObfuscationValueSchema,
  H1: ObfuscationValueSchema,
  H2: ObfuscationValueSchema,
  H3: ObfuscationValueSchema,
  H4: ObfuscationValueSchema,
  I1: ObfuscationValueSchema.optional(),
  I2: ObfuscationValueSchema.optional(),
  I3: ObfuscationValueSchema.optional(),
  I4: ObfuscationValueSchema.optional(),
  I5: ObfuscationValueSchema.optional(),
})
