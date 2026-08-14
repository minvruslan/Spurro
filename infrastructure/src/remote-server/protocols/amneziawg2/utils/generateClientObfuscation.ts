import type { Amneziawg2ConfigOptions, Amneziawg2Intensity } from "../../../../types/index.js"
import { genCfg } from "../vendor/awg-architect/engines/awg/generator/index"
import type { Amneziawg2ClientObfuscation } from "../types/index.js"
import { ObfuscationGeneratorBaseInput } from "./ObfuscationGeneratorBaseInput.js"

export const JUNK_PACKET_COUNT_BY_LEVEL: Record<Amneziawg2Intensity, number> = {
  low: 4,
  medium: 6,
  high: 8,
}

const SIGNATURE_SIZE_WITHOUT_FINGERPRINT: Amneziawg2Intensity = "medium"

export function generateClientObfuscation(
  options: Amneziawg2ConfigOptions,
): Amneziawg2ClientObfuscation {
  const junkLevel = JUNK_PACKET_COUNT_BY_LEVEL[options.junkPacketCount]
  const base = { ...ObfuscationGeneratorBaseInput, profile: options.protocolProfile, junkLevel }

  const junk = genCfg({ ...base, intensity: options.junkPacketSize })

  const signature = genCfg({
    ...base,
    intensity: SIGNATURE_SIZE_WITHOUT_FINGERPRINT,
    useBrowserFp: options.browserFingerprint !== null,
    browserProfile: options.browserFingerprint ?? "",
  })

  const noise =
    options.noisePackets === null ? null : genCfg({ ...base, intensity: options.noisePackets })

  return {
    jc: junk.jc,
    jmin: junk.jmin,
    jmax: junk.jmax,
    i1: signature.i1,
    ...(noise && { i2: noise.i2, i3: noise.i3, i4: noise.i4, i5: noise.i5 }),
  }
}
