import {
  Amneziawg2BrowserFingerprintSchema,
  Amneziawg2IntensitySchema,
  Amneziawg2ProtocolProfileSchema,
  type Amneziawg2ObfuscationOptions,
} from "@vancloak/api-contract"
import type { ObfuscationLevel } from "../types/ObfuscationLevel"

export const Amneziawg2ObfuscationPresets: Record<ObfuscationLevel, Amneziawg2ObfuscationOptions> =
  {
    medium: {
      protocolProfile: Amneziawg2ProtocolProfileSchema.enum.quic_initial,
      browserFingerprint: Amneziawg2BrowserFingerprintSchema.enum.chrome,
      junkPacketCount: Amneziawg2IntensitySchema.enum.medium,
      junkPacketSize: Amneziawg2IntensitySchema.enum.medium,
      noisePackets: null,
    },
    high: {
      protocolProfile: Amneziawg2ProtocolProfileSchema.enum.quic_initial,
      browserFingerprint: Amneziawg2BrowserFingerprintSchema.enum.chrome,
      junkPacketCount: Amneziawg2IntensitySchema.enum.high,
      junkPacketSize: Amneziawg2IntensitySchema.enum.high,
      noisePackets: Amneziawg2IntensitySchema.enum.medium,
    },
  }
