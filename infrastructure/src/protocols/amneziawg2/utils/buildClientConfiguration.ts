import type { Amneziawg2Obfuscation } from "../types/index.js"

export function buildClientConfiguration(params: {
  clientPrivateKey: string
  clientIP: string
  serverPublicKey: string
  presharedKey: string
  serverEndpoint: string
  obfuscation: Amneziawg2Obfuscation
  dns: string
}): string {
  const {
    clientPrivateKey,
    clientIP,
    serverPublicKey,
    presharedKey,
    serverEndpoint,
    obfuscation,
    dns,
  } = params

  return [
    "[Interface]",
    `Address = ${clientIP}/32`,
    `DNS = ${dns}`,
    `PrivateKey = ${clientPrivateKey}`,
    `Jc = ${obfuscation.Jc}`,
    `Jmin = ${obfuscation.Jmin}`,
    `Jmax = ${obfuscation.Jmax}`,
    `S1 = ${obfuscation.S1}`,
    `S2 = ${obfuscation.S2}`,
    `S3 = ${obfuscation.S3}`,
    `S4 = ${obfuscation.S4}`,
    `H1 = ${obfuscation.H1}`,
    `H2 = ${obfuscation.H2}`,
    `H3 = ${obfuscation.H3}`,
    `H4 = ${obfuscation.H4}`,
    ...(["I1", "I2", "I3", "I4", "I5"] as const)
      .filter((key) => obfuscation[key])
      .map((key) => `${key} = ${obfuscation[key]}`),
    "",
    "[Peer]",
    `PublicKey = ${serverPublicKey}`,
    `PresharedKey = ${presharedKey}`,
    "AllowedIPs = 0.0.0.0/0, ::/0",
    `Endpoint = ${serverEndpoint}`,
    "PersistentKeepalive = 25",
    "",
  ].join("\n")
}
