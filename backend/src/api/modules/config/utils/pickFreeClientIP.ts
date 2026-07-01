import { AMNEZIAWG_SUBNET_PREFIX } from "@spurro/shared"

const FIRST_CLIENT_OCTET = 2
const LAST_CLIENT_OCTET = 254

export function pickFreeClientIP(usedIPs: (string | null)[]): string | null {
  const used = new Set<number>()

  for (const ip of usedIPs) {
    const octet = ip ? Number(ip.split(".")[3]) : NaN
    if (!Number.isNaN(octet)) used.add(octet)
  }

  for (let octet = FIRST_CLIENT_OCTET; octet <= LAST_CLIENT_OCTET; octet++) {
    if (!used.has(octet)) return `${AMNEZIAWG_SUBNET_PREFIX}.${octet}`
  }

  return null
}
