import type { Amneziawg2ClientIdentifier } from "@spurro/shared"
import { Amneziawg2ClientIdentifierSchema } from "@spurro/shared"

const FIRST_CLIENT_OCTET = 2
const LAST_CLIENT_OCTET = 254

export function pickFreeAmneziawg2ClientIP(
  usedIPs: (string | null)[],
  subnetPrefix: string,
): Amneziawg2ClientIdentifier | null {
  const used = new Set<number>()

  for (const ip of usedIPs) {
    const octet = ip ? Number(ip.split(".")[3]) : NaN
    if (!Number.isNaN(octet)) used.add(octet)
  }

  for (let octet = FIRST_CLIENT_OCTET; octet <= LAST_CLIENT_OCTET; octet++) {
    if (!used.has(octet)) return Amneziawg2ClientIdentifierSchema.parse(`${subnetPrefix}.${octet}`)
  }

  return null
}
