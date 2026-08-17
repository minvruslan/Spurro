import type { Amneziawg2ServerObfuscation } from "../../../../types/index.js"
import { ALLOWED_IPS, PERSISTENT_KEEPALIVE_SECONDS, TUNNEL_MTU } from "../constants/index.js"
import type { Amneziawg2ClientObfuscation } from "../types/index.js"

export function buildClientConfiguration(params: {
  clientPrivateKey: string
  clientIp: string
  serverPublicKey: string
  presharedKey: string
  serverEndpoint: string
  serverObfuscation: Amneziawg2ServerObfuscation
  clientObfuscation: Amneziawg2ClientObfuscation
  dns: string
}): string {
  const {
    clientPrivateKey,
    clientIp,
    serverPublicKey,
    presharedKey,
    serverEndpoint,
    serverObfuscation,
    clientObfuscation,
    dns,
  } = params

  return [
    "[Interface]",
    `Address = ${clientIp}/32`,
    `DNS = ${dns}`,
    `MTU = ${TUNNEL_MTU}`,
    `PrivateKey = ${clientPrivateKey}`,
    `Jc = ${clientObfuscation.jc}`,
    `Jmin = ${clientObfuscation.jmin}`,
    `Jmax = ${clientObfuscation.jmax}`,
    `S1 = ${serverObfuscation.s1}`,
    `S2 = ${serverObfuscation.s2}`,
    `S3 = ${serverObfuscation.s3}`,
    `S4 = ${serverObfuscation.s4}`,
    `H1 = ${serverObfuscation.h1}`,
    `H2 = ${serverObfuscation.h2}`,
    `H3 = ${serverObfuscation.h3}`,
    `H4 = ${serverObfuscation.h4}`,
    ...(["i1", "i2", "i3", "i4", "i5"] as const)
      .filter((key) => clientObfuscation[key])
      .map((key) => `${key.toUpperCase()} = ${clientObfuscation[key]}`),
    "",
    "[Peer]",
    `PublicKey = ${serverPublicKey}`,
    `PresharedKey = ${presharedKey}`,
    `AllowedIPs = ${ALLOWED_IPS.join(", ")}`,
    `Endpoint = ${serverEndpoint}`,
    `PersistentKeepalive = ${PERSISTENT_KEEPALIVE_SECONDS}`,
    "",
  ].join("\n")
}
