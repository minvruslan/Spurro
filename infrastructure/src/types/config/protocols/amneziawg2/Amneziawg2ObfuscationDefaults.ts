import { Amneziawg2BrowserFingerprintSchema } from "./Amneziawg2BrowserFingerprintSchema"
import { Amneziawg2IntensitySchema } from "./Amneziawg2IntensitySchema"
import { Amneziawg2ProtocolProfileSchema } from "./Amneziawg2ProtocolProfileSchema"
import type { Amneziawg2ObfuscationOptions } from "./Amneziawg2ObfuscationOptions"

export const Amneziawg2ObfuscationDefaults = {
  protocolProfile: Amneziawg2ProtocolProfileSchema.enum.quic_initial,
  browserFingerprint: Amneziawg2BrowserFingerprintSchema.enum.chrome,
  junkPacketCount: Amneziawg2IntensitySchema.enum.medium,
  junkPacketSize: Amneziawg2IntensitySchema.enum.medium,
  noisePackets: null,
} as const satisfies Amneziawg2ObfuscationOptions
