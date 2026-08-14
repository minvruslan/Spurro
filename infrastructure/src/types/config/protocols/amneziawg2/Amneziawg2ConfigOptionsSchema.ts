import { z } from "zod"
import { ProtocolCodeSchema } from "../../../protocols/ProtocolCodeSchema"
import { Amneziawg2BrowserFingerprintSchema } from "./Amneziawg2BrowserFingerprintSchema"
import { Amneziawg2IntensitySchema } from "./Amneziawg2IntensitySchema"
import { Amneziawg2ObfuscationDefaults } from "./Amneziawg2ObfuscationDefaults"
import { Amneziawg2ProtocolProfileSchema } from "./Amneziawg2ProtocolProfileSchema"

export const Amneziawg2ConfigOptionsSchema = z.object({
  protocolCode: z.literal(ProtocolCodeSchema.enum.amneziawg2),
  protocolProfile: Amneziawg2ProtocolProfileSchema.default(
    Amneziawg2ObfuscationDefaults.protocolProfile,
  ),
  browserFingerprint: Amneziawg2BrowserFingerprintSchema.nullable().default(
    Amneziawg2ObfuscationDefaults.browserFingerprint,
  ),
  junkPacketCount: Amneziawg2IntensitySchema.default(Amneziawg2ObfuscationDefaults.junkPacketCount),
  junkPacketSize: Amneziawg2IntensitySchema.default(Amneziawg2ObfuscationDefaults.junkPacketSize),
  noisePackets: Amneziawg2IntensitySchema.nullable().default(
    Amneziawg2ObfuscationDefaults.noisePackets,
  ),
})
