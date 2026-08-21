import type { ConfigLimit } from "@spurro/api-contract"

export function isReachedConfigLimit(configLimit: ConfigLimit): boolean {
  return configLimit.used >= configLimit.maxCount
}
