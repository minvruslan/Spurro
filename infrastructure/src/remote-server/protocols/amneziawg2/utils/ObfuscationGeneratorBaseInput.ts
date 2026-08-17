import type { GeneratorInput } from "../vendor/awg-architect/engines/awg/generator/types"
import { TUNNEL_MTU } from "../constants/index.js"

export const ObfuscationGeneratorBaseInput = {
  version: "2.0",
  clientId: "amneziavpn",
  clientRelease: null,
  customHost: "",
  hostRegion: "any",
  mtu: TUNNEL_MTU,
  mimicAll: false,
  useTagC: false,
  useTagT: true,
  useTagR: true,
  useTagRC: true,
  useTagRD: true,
  useBrowserFp: false,
  browserProfile: "",
  routerMode: false,
  useExtremeMax: false,
  iterCount: 0,
  useHeaderProtection: false,
  useContentPadding: false,
  useRandomTimings: false,
} as const satisfies Partial<GeneratorInput>
