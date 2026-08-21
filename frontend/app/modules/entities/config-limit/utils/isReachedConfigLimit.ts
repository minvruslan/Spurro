import type { ConfigLimit } from "@vancloak/api-contract"

export function isReachedConfigLimit(configLimit: ConfigLimit): boolean {
  return configLimit.used >= configLimit.maxCount
}
