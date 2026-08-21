import {
  ProtocolCodeSchema,
  type Amneziawg2ObfuscationOptions,
  type ConfigData,
} from "@spurro/api-contract"
import { Amneziawg2ObfuscationPresets } from "../constants/Amneziawg2ObfuscationPresets"
import { ObfuscationLevelOrder } from "../types/ObfuscationLevelOrder"
import type { ConfigObfuscationLevel } from "../types/ConfigObfuscationLevel"

function matchesPreset(
  options: Amneziawg2ObfuscationOptions,
  preset: Amneziawg2ObfuscationOptions,
): boolean {
  return (
    options.protocolProfile === preset.protocolProfile &&
    options.browserFingerprint === preset.browserFingerprint &&
    options.junkPacketCount === preset.junkPacketCount &&
    options.junkPacketSize === preset.junkPacketSize &&
    options.noisePackets === preset.noisePackets
  )
}

export function getConfigObfuscationLevel(data: ConfigData): ConfigObfuscationLevel | null {
  if (data.protocolCode !== ProtocolCodeSchema.enum.amneziawg2) return null
  const matchedLevel = ObfuscationLevelOrder.find((level) =>
    matchesPreset(data.options, Amneziawg2ObfuscationPresets[level]),
  )
  return matchedLevel ?? "custom"
}
