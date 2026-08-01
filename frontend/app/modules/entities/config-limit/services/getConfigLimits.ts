import type { ConfigLimit } from "@spurro/api-contract"

export async function getConfigLimits(): Promise<ConfigLimit[]> {
  return useApiClient().configLimits.getUserConfigLimits()
}
